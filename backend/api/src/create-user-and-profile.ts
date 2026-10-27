import {setLastOnlineTimeUser} from 'api/set-last-online-time'
import {setProfileOptions} from 'api/update-options'
import {APIErrors} from 'common/api/utils'
import {defaultLocale} from 'common/constants'
import {sendDiscordMessage} from 'common/discord/core'
import {
  bannedNetworkSignupDiscordMessage,
  newMemberDiscordMessage,
  vpnSignupDiscordMessage,
} from 'common/discord/messages'
import {debug} from 'common/logger'
import {BanReason} from 'common/moderation/ban'
import {trimStrings} from 'common/parsing'
import {convertPrivateUser, convertUser} from 'common/supabase/users'
import {PrivateUser} from 'common/user'
import {getDefaultNotificationPreferences} from 'common/user-notification-preferences'
import {cleanDisplayName, impersonatesStaff} from 'common/util/clean-username'
import {removeUndefinedProps} from 'common/util/object'
import {sendWelcomeEmail} from 'email/functions/helpers'
import * as admin from 'firebase-admin'
import {getIp, track} from 'shared/analytics'
import {getBucket} from 'shared/firebase-utils'
import {generateAvatarUrl} from 'shared/helpers/generate-and-update-avatar-urls'
import {BannedNetworkMatch, findBannedNetwork} from 'shared/moderation/banned-networks'
import {isApplePrivateEmail} from 'shared/moderation/vpn-asns'
import {isVpnTableComplete, lookupVpnNetwork} from 'shared/moderation/vpn-check'
import {getReferrer, notifyReferrerOfSignup} from 'shared/outreach/referrals'
import {removePinnedUrlFromPhotoUrls} from 'shared/profiles/parse-photos'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {updateUser} from 'shared/supabase/users'
import {insert} from 'shared/supabase/utils'
import {getUserByUsername, log} from 'shared/utils'

import {APIHandler} from './helpers/endpoint'
import {validateUsername} from './validate-username'

export const createUserAndProfile: APIHandler<'create-user-and-profile'> = async (
  props,
  auth,
  req,
) => {
  trimStrings(props)
  const {
    deviceToken,
    locale = defaultLocale,
    username,
    name,
    profile,
    interests,
    causes,
    work,
  } = props
  await removePinnedUrlFromPhotoUrls(profile)

  // const host = req.get('referer')

  const ip = getIp(req)

  const pg = createSupabaseDirectClient()

  // `|| 'User'` twice over: the caller may send nothing, and cleaning can also empty a name that
  // was nothing but emoji.
  const cleanName = cleanDisplayName(name || 'User') || 'User'
  if (impersonatesStaff(cleanName))
    throw APIErrors.badRequest('This name is reserved for Compass staff', {
      field: 'name',
      resolution: 'Please sign up under the name people know you by.',
    })

  const fbUser = await admin.auth().getUser(auth.uid)
  const email = fbUser.email

  const bucket = getBucket()
  const avatarUrl = profile.pinned_url ?? (await generateAvatarUrl(auth.uid, cleanName, bucket))

  let finalUsername = username
  const validation = await validateUsername(username)
  if (validation.suggestedUsername) {
    finalUsername = validation.suggestedUsername
  } else if (!validation.valid) {
    throw APIErrors.badRequest(validation.message || 'Invalid username', {
      field: 'username',
      resolution:
        'Usernames must be 3–25 characters and contain only letters, numbers, or underscores.',
    })
  }

  // The pg.tx() call wraps several database operations in a single atomic transaction,
  // ensuring they either all succeed or all fail together.
  const {user, privateUser, newProfileRow, bannedMatch} = await pg.tx(async (tx) => {
    const existingUser = await tx.oneOrNone('select id from users where id = $1', [auth.uid])
    if (existingUser) {
      const existingProfile = await tx.oneOrNone('select id from profiles where user_id = $1', [
        auth.uid,
      ])
      if (existingProfile) {
        throw APIErrors.conflict('An account for this user already exists', {
          resolution:
            'If you already have an account, try logging in. If you believe this is a mistake, contact support.',
        })
      } else {
        await pg.none('DELETE FROM users WHERE id = $1', [auth.uid])
      }
    }

    const sameNameUser = await getUserByUsername(finalUsername, tx)
    if (sameNameUser) {
      throw APIErrors.conflict('Username is already taken', {
        field: 'username',
        resolution: 'Please choose a different username.',
      })
    }

    const privateUserData: PrivateUser = {
      id: auth.uid,
      email,
      locale,
      initialIpAddress: ip,
      initialDeviceToken: deviceToken,
      notificationPreferences: getDefaultNotificationPreferences(),
      blockedUserIds: [],
      blockedByUserIds: [],
    }

    // Signing up from the device or network of a confirmed abuser (backend/shared/src/moderation/
    // banned-networks.ts). A device token names one browser, so a match there keeps the full
    // lockout the hand-curated list always gave. An address is shared and reassigned, so an IP match
    // only buys the same provisional hold as a VPN signup, and a human decides.
    const bannedMatch: BannedNetworkMatch | null = await findBannedNetwork(tx, ip, deviceToken)

    const newUserRow = await insert(tx, 'users', {
      id: auth.uid,
      name: cleanName,
      username: finalUsername,
      avatar_url: avatarUrl,
      is_banned_from_posting: !!bannedMatch,
      ban_reason: bannedMatch?.kind === 'ip' ? ('under_review' satisfies BanReason) : null,
      data: {},
    })

    const newPrivateUserRow = await insert(tx, 'private_users', {
      id: privateUserData.id,
      data: privateUserData,
    })

    const profileData = removeUndefinedProps(profile)

    // Resolve `?referrer=` to a member once, here, inside the same transaction that creates them.
    // The raw name is kept as-is; the id is what the referral tree is walked over, and an id has to
    // be pinned at signup to be worth anything — resolving it later reads a username that may since
    // have moved to someone else, or to nobody. A name matching no member stays an honest NULL.
    const referredByUserId = profileData.referred_by_username
      ? ((await getReferrer(profileData.referred_by_username, tx))?.id ?? null)
      : null

    const newProfileRow = await insert(tx, 'profiles', {
      user_id: auth.uid,
      ...profileData,
      referred_by_user_id: referredByUserId,
    })

    const profileId = newProfileRow.id

    await setProfileOptions(tx, profileId, auth.uid, 'interests', interests)
    await setProfileOptions(tx, profileId, auth.uid, 'causes', causes)
    await setProfileOptions(tx, profileId, auth.uid, 'work', work)

    return {
      user: convertUser(newUserRow),
      privateUser: convertPrivateUser(newPrivateUserRow),
      newProfileRow,
      bannedMatch,
    }
  })

  log('created user and profile', {username: user.username, firebaseId: auth.uid})

  if (bannedMatch) {
    // #reports, before the response for the same Cloud Run reason as the VPN check below. A failed
    // webhook leaves the ban in place; it just waits longer for someone to notice.
    try {
      await sendDiscordMessage(bannedNetworkSignupDiscordMessage(user, bannedMatch, ip), 'reports')
    } catch (e) {
      console.error('Failed to send discord banned network signup', e)
    }
  }

  // Signing up from behind a commercial VPN is the strongest signal we have at the moment of
  // registration: in the September 2026 audit these networks carried 12 of our 13 confirmed-abuse
  // accounts. It is nowhere near proof — plenty of members run a VPN for perfectly good reasons —
  // so it buys a provisional hold and a nudge to a human, never a ban. What counts as a VPN, and
  // why, is in backend/shared/src/moderation/vpn-asns.ts.
  //
  // Done before the response goes out, not in the continuation after it, because of where this
  // runs: Cloud Run only gives an instance CPU while a request is in flight. The check used to live
  // in the continuation so a cold instance's prefix load would never hold up a signup — and on 8
  // October 2026 that is exactly how a scammer on SecFirewall (AS206092) got in: the load the
  // server started at boot had stalled for want of CPU, the check ran after the response, waited
  // its full minute on an idle instance, and gave up. In the request the wait is bounded and
  // normally zero, since the tables are already loaded; on a cold instance it is the few seconds
  // RIPE takes to answer. Holding the person a moment later is not an option here.
  //
  // Someone arriving on an Apple Hide My Email address is exempt: that means Apple's privacy
  // plumbing, which is the opposite of a fraud signal, and it travels with iCloud Private Relay.
  let held = false
  // Already banned on the list above: the VPN hold would add nothing, and would soften a device
  // lockout into a provisional hold.
  let vpnChecked = !!bannedMatch || isApplePrivateEmail(email)
  const checkVpnAndHold = async (maxWaitMs: number) => {
    const vpnNetwork = await lookupVpnNetwork(ip, maxWaitMs)
    vpnChecked = isVpnTableComplete()
    if (!vpnNetwork) return
    held = true
    await updateUser(user.id, {
      isBannedFromPosting: true,
      banReason: 'under_review' satisfies BanReason,
    })
    // #reports rather than #members: a queue item for a moderator, not an announcement. A failed
    // webhook must not undo the hold — the account is held either way, it just waits longer for
    // someone to notice.
    try {
      await sendDiscordMessage(vpnSignupDiscordMessage(user, vpnNetwork, ip), 'reports')
    } catch (e) {
      console.error('Failed to send discord vpn signup', e)
    }
  }
  if (!vpnChecked) {
    try {
      await checkVpnAndHold(VPN_CHECK_MAX_WAIT_MS)
    } catch (e) {
      console.error('Failed to run the VPN check on signup', e)
    }
  }

  const continuation = async () => {
    try {
      await track(auth.uid, 'create profile', {username: user.username})
    } catch (e) {
      console.error('Failed to track create profile', e)
    }
    try {
      await sendWelcomeEmail(user, privateUser)
    } catch (e) {
      console.error('Failed to sendWelcomeEmail', e)
    }
    try {
      await setLastOnlineTimeUser(auth.uid)
    } catch (e) {
      console.error('Failed to set last online time', e)
    }
    // Resolved before the announcement rather than inside it, so a failed lookup costs the mention
    // and not the whole post. Null covers both "nobody referred them" and "the name refers to no
    // member" — `?referrer=` is whatever was in the URL, and a link to a profile that does not exist
    // is worse in a public channel than saying nothing.
    let referrer: {name: string; username: string} | null = null
    try {
      if (newProfileRow.referred_by_username) {
        referrer = await getReferrer(newProfileRow.referred_by_username, pg)
      }
    } catch (e) {
      console.error('Failed to resolve referrer for discord new profile', e)
    }

    try {
      await sendDiscordMessage(newMemberDiscordMessage(user, referrer), 'members')
    } catch (e) {
      console.error('Failed to send discord new profile', e)
    }
    // Second chance for the VPN check when the one above could not finish: it costs nothing, and by
    // the time this runs the first load may have landed. (After the response Cloud Run gives this
    // instance almost no CPU, so this mostly helps when another request comes in meanwhile.)
    if (!vpnChecked) {
      try {
        await checkVpnAndHold(60_000)
      } catch (e) {
        console.error('Failed to re-run the VPN check after signup', e)
      }
    }
    try {
      // The one moment a sharer can be told their share worked. Miss it and `?referrer=` stays a
      // number nobody ever sees.
      if (newProfileRow.referred_by_username) {
        await notifyReferrerOfSignup(
          {name: user.name, username: user.username, avatarUrl: user.avatarUrl},
          newProfileRow.referred_by_username,
          pg,
        )
      }
    } catch (e) {
      console.error('Failed to notify referrer of signup', e)
    }
    try {
      const nProfiles = await pg.one<number>(`SELECT count(*) FROM profiles`, [], (r) =>
        Number(r.count),
      )

      const isMilestone = (n: number) => {
        return (
          [15, 20, 30, 40].includes(n) || // early milestones
          n % 100 === 0
        )
      }
      debug(nProfiles, isMilestone(nProfiles))
      if (isMilestone(nProfiles)) {
        await sendDiscordMessage(`We just reached **${nProfiles}** total profiles! 🎉`, 'general')
      }
    } catch (e) {
      console.error('Failed to send discord user milestone', e)
    }
  }

  return {
    result: {
      // include everything the frontend needs
      user: held
        ? {...user, isBannedFromPosting: true, banReason: 'under_review' satisfies BanReason}
        : user,
      privateUser,
      profile: {
        ...newProfileRow,
        interests: interests ?? [],
        causes: causes ?? [],
        work: work ?? [],
      },
    },
    continue: continuation,
  }
}

/**
 * The most a signup waits for the VPN prefix tables. With the tables loaded, which is the normal
 * case, the check is instant; this only bites on a cold instance whose boot-time load is still
 * running or had failed, where a fresh load from RIPE takes a few seconds with CPU to run on.
 */
const VPN_CHECK_MAX_WAIT_MS = 15_000
