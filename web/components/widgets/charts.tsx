import {useEffect, useState} from "react";
import {CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import {getUserCreations} from "web/lib/supabase/users";

export default function ChartComponent() {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function loadData() {
      // Load some data from the backend API or Supabase
      const data = await getUserCreations()
      let counts: { [date: string]: number } = {}
      data.forEach((d) => {
        const date = new Date(d.created_time).toISOString().split('T')[0]
        counts[date] = (counts[date] || 0) + 1
      })
      const json: any = Object.entries(counts).map(([date, value]) => ({date, value}))
      let prev = 0
      for (let i = 0; i < json.length; i++) {
        json[i].value += prev
        prev = json[i].value
      }
      json.sort((a: any, b: any) => a.date.localeCompare(b.date))

      // Example static data
      // const json: any = [
      //   { date: '2023-01-01', value: 400 },
      //   { date: '2023-02-01', value: 300 },
      //   { date: '2023-03-01', value: 500 },
      //   { date: '2023-04-01', value: 200 },
      //   { date: '2023-05-01', value: 600 },
      // ]
      setData(json);
    }

    loadData();
  }, []);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3"/>
        <XAxis dataKey="date" label={{value: "Date", position: "insideBottomRight", offset: -5}}/>
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
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="rgb(var(--color-primary-900))"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
