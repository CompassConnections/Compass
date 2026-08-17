import {ANDROID_APP_URL} from 'common/constants'
import {Notification} from 'common/notifications'
import {Row} from 'common/supabase/utils'
import {tryCatch} from 'common/util/try-catch'
import {createSupabaseDirectClient, SupabaseDirectClient} from 'shared/supabase/init'
import {
  createBulkNotification,
  insertNotificationToSupabase,
  NotificationTemplateTranslation,
} from 'shared/supabase/notifications'

const COMPASS_LOGO_URL =
  'https://firebasestorage.googleapis.com/v0/b/compass-130ba.firebasestorage.app/o/misc%2Fcompass-192.png?alt=media&token=9fd251c5-fc43-4375-b629-1a8f4bbe8185'

export const createAndroidReleaseNotifications = async () => {
  const createdTime = Date.now()
  const id = `android-release-${createdTime}`
  const notification: Notification = {
    id,
    userId: 'todo',
    createdTime: createdTime,
    isSeen: false,
    sourceType: 'info',
    sourceUpdateType: 'created',
    sourceSlug: ANDROID_APP_URL,
    sourceUserAvatarUrl: COMPASS_LOGO_URL,
    title: 'Android App Released on Google Play',
    sourceText:
      'The Compass Android app is now publicly available on Google Play! Download it today to stay connected on the go.',
  }
  return await createNotifications(notification)
}

export const createAndroidTestNotifications = async () => {
  const createdTime = Date.now()
  const id = `android-test-${createdTime}`
  const notification: Notification = {
    id,
    userId: 'todo',
    createdTime: createdTime,
    isSeen: false,
    sourceType: 'info',
    sourceUpdateType: 'created',
    sourceSlug: '/contact',
    sourceUserAvatarUrl: COMPASS_LOGO_URL,
    title: 'Android App Ready for Review — Help Us Unlock the Google Play Release',
    sourceText:
      'To release our app, Google requires a closed test with at least 12 testers for 14 days. Please share your Google Play–registered email address so we can add you as a tester and complete the review process.',
  }
  return await createNotifications(notification)
}

export const createShareNotifications = async () => {
  const createdTime = Date.now()
  const id = `share-${createdTime}`
  const notification: Notification = {
    id,
    userId: 'todo',
    createdTime: createdTime,
    isSeen: false,
    sourceType: 'info',
    sourceUpdateType: 'created',
    sourceSlug: '/contact',
    sourceUserAvatarUrl:
      'https://firebasestorage.googleapis.com/v0/b/compass-130ba.firebasestorage.app/o/misc%2Ficon-outreach-outstrip-outreach-272151502.jpg?alt=media&token=6d6fcecb-818c-4fca-a8e0-d2d0069b9445',
    title: 'Give us tips to reach more people',
    sourceText: '250 members already! Tell us where and how we can best share Compass.',
  }
  return await createNotifications(notification)
}

export const createVoteNotifications = async () => {
  const createdTime = Date.now()
  const id = `vote-${createdTime}`
  const notification: Notification = {
    id,
    userId: 'todo',
    createdTime: createdTime,
    isSeen: false,
    sourceType: 'info',
    sourceUpdateType: 'created',
    sourceSlug: '/vote',
    sourceUserAvatarUrl:
      'https://firebasestorage.googleapis.com/v0/b/compass-130ba.firebasestorage.app/o/misc%2Fvote-icon-design-free-vector.jpg?alt=media&token=f70b6d14-0511-49b2-830d-e7cabf7bb751',
    title: 'New Proposals & Votes Page',
    sourceText: "Create proposals and vote on other people's suggestions!",
  }
  return await createNotifications(notification)
}

export const createNotifications = async (notification: Notification) => {
  const pg = createSupabaseDirectClient()
  const {data: users, error} = await tryCatch(pg.many<Row<'users'>>('select * from users'))

  if (error) {
    console.error('Error fetching users', error)
    return
  }

  if (!users) {
    console.error('No users found')
    return
  }

  for (const user of users) {
    try {
      await createNotification(user, notification, pg)
    } catch (e) {
      console.error('Failed to create notification', e, user)
    }
  }

  return {
    success: true,
  }
}

export const createNotification = async (
  user: Row<'users'>,
  notification: Notification,
  pg: SupabaseDirectClient,
) => {
  notification.userId = user.id
  console.log('notification', user.username)
  return await insertNotificationToSupabase(notification, pg)
}

/**
 * Send "Events now available" notification to all users
 * Uses the new template-based system for efficient bulk notifications
 */
export const createEventsAvailableNotifications = async () => {
  // Create template and bulk notifications using the new system
  const {templateId, count} = await createBulkNotification({
    sourceType: 'info',
    title: 'New Events Page',
    sourceText:
      'You can now create and join events on Compass! Meet up with other members online or in person for workshops, social events, etc.',
    sourceSlug: '/events',
    sourceUserAvatarUrl: COMPASS_LOGO_URL,
    sourceUpdateType: 'created',
  })

  console.log(`Created events notification template ${templateId} for ${count} users`)

  return {
    success: true,
    templateId,
    userCount: count,
  }
}

export const createSomeNotifications = async () => {
  const translations: Omit<NotificationTemplateTranslation, 'template_id' | 'created_time'>[] = [
    // French translation
    {
      locale: 'fr',
      title: 'Bonjour',
      source_text: "C'est une notif",
    },
    // German translation
    {
      locale: 'de',
      title: 'Halo',
      source_text: 'Dis das',
    },
  ]

  // Create template with translations
  const {templateId, count} = await createBulkNotification(
    {
      sourceType: 'hello',
      title: 'Hello world',
      sourceText: 'This is a notification',
      sourceSlug: '/settings',
      sourceUserAvatarUrl: COMPASS_LOGO_URL,
      sourceUpdateType: 'created',
    },
    translations,
  )
  console.log(`Created some notification template ${templateId} for ${count} users`)
}

export const createInterestIndicatorNotifications = async () => {
  const translations: Omit<NotificationTemplateTranslation, 'template_id' | 'created_time'>[] = [
    // French translation
    {
      locale: 'fr',
      title: 'Nouveau : Signaux d’intérêt privés',
      source_text:
        'Vous pouvez désormais exprimer votre intérêt en privé à la fin de chaque profil. L’autre personne n’est informée que si l’intérêt est réciproque.',
    },
  ]

  // Create template with translations
  const {templateId, count} = await createBulkNotification(
    {
      sourceType: 'info',
      title: 'New: Private interest signals',
      sourceText:
        'You can now express interest privately at the end of each profile. The other person is only notified if it’s mutual.',
      sourceSlug: '/',
      sourceUserAvatarUrl: COMPASS_LOGO_URL,
      sourceUpdateType: 'created',
    },
    translations,
  )
  console.log(`Created some notification template ${templateId} for ${count} users`)
}

/**
 * Invite every member to opt in to being spotlighted on the logged-out home page.
 *
 * Framed around what the member gets, because that is the honest order of the argument: a spotlight is
 * a link to their profile on the one page of Compass that strangers and search engines actually reach,
 * and the growth benefit is the second-order effect of that, not a favour being asked.
 *
 * Sends them to /settings, where the toggle lives under Data & Privacy. It is only ever half the gate —
 * see `common/profiles/spotlights.ts` — so the copy has to say that consenting is not publishing, or
 * the first thing that happens is a member reloading the home page and wondering where they are.
 *
 * A broadcast to the whole membership. Run it once, deliberately, from
 * `backend/scripts/2026-08-12-invite-members-to-spotlight.ts`.
 */
export const createSpotlightInviteNotifications = async () => {
  const title = 'Want to be on the Compass home page?'
  const sourceText =
    'We’re putting a few real members on the home page: a passage from your own bio, your name and photo, linked to your profile. That page is where people who find Compass through a search engine land, and most of them never sign in — so it reaches well beyond the members you can already meet here. It also does the thing no statistic does: a front page with real people on it is what makes a stranger decide this is worth joining. Opt in from Settings → Data & Privacy. We choose and review every card before it goes up, and switching it off takes it down.'

  const translations: Omit<NotificationTemplateTranslation, 'template_id' | 'created_time'>[] = [
    {
      locale: 'fr',
      title: 'Envie d’apparaître sur la page d’accueil de Compass ?',
      source_text:
        'On met quelques membres bien réels sur la page d’accueil : un passage de ta propre bio, ton prénom et ta photo, avec un lien vers ton profil. C’est la page où arrivent les personnes qui trouvent Compass via un moteur de recherche, et la plupart ne se connectent jamais — ta visibilité va donc bien au-delà des membres que tu peux déjà rencontrer ici. Et ça fait ce qu’aucune statistique ne fait : une page d’accueil avec de vraies personnes dessus, c’est ce qui donne envie à un inconnu de nous rejoindre. Active-le dans Réglages → Données et confidentialité. On choisit et on relit chaque fiche avant publication, et la désactiver la retire.',
    },
    {
      locale: 'de',
      title: 'Möchten Sie auf die Compass-Startseite?',
      source_text:
        'Wir stellen einige echte Mitglieder auf die Startseite: eine Passage aus Ihrer eigenen Biografie, Ihr Name und Ihr Foto, verlinkt mit Ihrem Profil. Auf dieser Seite landen die Menschen, die Compass über eine Suchmaschine finden, und die meisten melden sich nie an — Ihre Sichtbarkeit reicht also weit über die Mitglieder hinaus, die Sie hier ohnehin treffen. Und sie leistet, was keine Statistik leistet: Eine Startseite mit echten Menschen darauf ist das, was Fremde zum Mitmachen bewegt. Schalten Sie es unter Einstellungen → Daten & Privatsphäre ein. Wir wählen und prüfen jede Karte vor der Veröffentlichung, und Ausschalten nimmt sie wieder herunter.',
    },
  ]

  const {templateId, count} = await createBulkNotification(
    {
      sourceType: 'info',
      title,
      sourceText,
      sourceSlug: '/settings',
      sourceUserAvatarUrl: COMPASS_LOGO_URL,
      sourceUpdateType: 'created',
    },
    translations,
  )

  console.log(`Created spotlight invite template ${templateId} for ${count} users`)

  return {templateId, count}
}
