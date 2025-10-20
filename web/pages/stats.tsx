import {PageBase} from "web/components/page-base";
import ChartMembers from "web/components/widgets/charts";
import {getCount} from "web/lib/supabase/users";
import {useEffect, useState} from "react";
import StatBox from "web/components/widgets/stat-box";
import clsx from "clsx";
import {Col} from "web/components/layout/col";

export default function Stats() {
  const [data, setData] = useState<Record<string, number | null>>({})

  useEffect(() => {
    async function load() {
      const tables = [
        'profiles',
        'active_members',
        'bookmarked_searches',
        'private_user_message_channels',
        'private_user_messages',
        'profile_comments',
        'compatibility_prompts',
        'compatibility_answers',
        'votes',
        'vote_results',
      ] as const

      const settled = await Promise.allSettled(
        tables.map((t) => getCount(t))
      )

      const result: Record<string, number | null> = {}
      settled.forEach((res, i) => {
        const key = tables[i]
        if (res.status === 'fulfilled') result[key] = res.value
        else result[key] = null
      })

      setData(result)
    }

    void load()
  }, [])

  return (
    <PageBase trackPageView={'charts'}>
      <h1 className="text-3xl font-semibold text-center mb-6">Growth & Stats</h1>
      <Col className={'sm:mx-4 mx-1 mb-8'}>
        <ChartMembers/>
      </Col>
      <Col className={'mx-4 mb-8'}>
        <Col
          className={clsx(
            'pb-[58px] lg:pb-0', // bottom bar padding
            'text-ink-1000 mx-auto w-full grid grid-cols-1 gap-8 max-w-3xl sm:grid-cols-2 lg:min-h-0 lg:pt-4 mt-4',
          )}
        >
          {!!data.profiles && <StatBox value={data.profiles} label={'Members'} />}
          {!!data.active_members && <StatBox value={data.active_members} label={'Active Members (last month)'} />}
          {!!data.private_user_message_channels && <StatBox value={data.private_user_message_channels} label={'Discussions'} />}
          {!!data.private_user_messages && <StatBox value={data.private_user_messages} label={'Messages'} />}
          {!!data.compatibility_prompts && <StatBox value={data.compatibility_prompts} label={'Compatibility Prompts'} />}
          {!!data.compatibility_answers && <StatBox value={data.compatibility_answers} label={'Prompts Answered'} />}
          {!!data.votes && <StatBox value={data.votes} label={'Proposals'} />}
          {!!data.vote_results && <StatBox value={data.vote_results} label={'Votes'} />}
          {!!data.bookmarked_searches && <StatBox value={data.bookmarked_searches} label={'Searches Bookmarked'} />}
          {!!data.profile_comments && <StatBox value={data.profile_comments} label={'Endorsements'} />}
        </Col>
      </Col>
    </PageBase>
  );
}
