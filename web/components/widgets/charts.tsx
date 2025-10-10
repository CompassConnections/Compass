import {useEffect, useState} from "react";
import {Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import {getProfilesCreations, getProfilesWithBioCreations} from "web/lib/supabase/users";

// Helper to convert rows into date -> count map
function buildCounts(rows: any[]) {
  const counts: Record<string, number> = {}
  for (const r of rows) {
    const date = new Date(r.created_time).toISOString().split('T')[0]
    counts[date] = (counts[date] || 0) + 1
  }
  return counts
}

// Helper to turn count map into cumulative by sorted date array
function cumulativeFromCounts(counts: Record<string, number>, sortedDates: string[]) {
  const out: Record<string, number> = {}
  let prev = 0
  for (const d of sortedDates) {
    const v = counts[d] || 0
    prev += v
    out[d] = prev
  }
  return out
}


export default function ChartMembers() {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const [allProfiles, bioProfiles] = await Promise.all([
        getProfilesCreations(),
        getProfilesWithBioCreations(),
      ])

      const countsAll = buildCounts(allProfiles)
      const countsBio = buildCounts(bioProfiles)

      // Build a full daily date range from min to max date for equidistant time axis
      const allDates = Object.keys(countsAll)
      const bioDates = Object.keys(countsBio)
      const minDateStr = [
        ...allDates,
        ...bioDates,
      ].sort((a, b) => a.localeCompare(b))[0]
      const maxDateStr = [
        ...allDates,
        ...bioDates,
      ].sort((a, b) => b.localeCompare(a))[0]

      function toISODate(d: Date) {
        return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
          .toISOString()
          .split('T')[0]
      }

      function addDays(d: Date, days: number) {
        const nd = new Date(d)
        nd.setUTCDate(nd.getUTCDate() + days)
        return nd
      }

      function buildDailyRange(startStr: string, endStr: string) {
        const out: string[] = []
        const start = new Date(startStr + 'T00:00:00.000Z')
        const end = new Date(endStr + 'T00:00:00.000Z')
        for (let d = start; d <= end; d = addDays(d, 1)) {
          out.push(toISODate(d))
        }
        return out
      }

      const dates = buildDailyRange(minDateStr, maxDateStr)

      const cumAll = cumulativeFromCounts(countsAll, dates)
      const cumBio = cumulativeFromCounts(countsBio, dates)

      const merged = dates.map((date) => ({
        date,
        dateTs: new Date(date + 'T00:00:00.000Z').getTime(),
        profilesCreations: cumAll[date] || 0,
        profilesWithBioCreations: cumBio[date] || 0,
      }))

      setData(merged)
    }

    void load()
  }, [])

  // One LineChart with two Line series sharing the same data array
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        {/*<CartesianGrid strokeDasharray="3 3"/>*/}
        <XAxis
          dataKey="dateTs"
          type="number"
          scale="time"
          domain={["dataMin", "dataMax"]}
          tickFormatter={(ts) => new Date(ts).toISOString().split("T")[0]}
          label={{value: "Date", position: "insideBottomRight", offset: -5}}
        />
        <YAxis label={{value: "Number of Members", angle: -90, position: "insideLeft"}}/>
        <Tooltip
          contentStyle={{
            backgroundColor: "rgb(var(--color-canvas-100))",
            border: "none",
            borderRadius: "8px",
            color: "rgb(var(--color-primary-900))",
          }}
          labelStyle={{
            color: "rgb(var(--color-primary-900))",
          }}
          labelFormatter={(value, payload) => (payload && payload[0] && payload[0].payload?.date) || new Date(value as number).toISOString().split("T")[0]}
        />
        <Legend/>
        <Line
          type="monotone"
          dataKey="profilesCreations"
          name="Total"
          stroke="rgb(var(--color-primary-900))"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="profilesWithBioCreations"
          name="With Bio"
          stroke="#9ca3af"
          strokeDasharray="4 2"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
