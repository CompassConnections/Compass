// ChartComponent.jsx
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function ChartComponent() {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function loadData() {
      // Load some data from the backend API or Supabase
      // const res = await fetch("http://localhost:5000/api/data");
      // const json = await res.json();
      const json: any = [
        { date: '2023-01-01', value: 400 },
        { date: '2023-02-01', value: 300 },
        { date: '2023-03-01', value: 500 },
        { date: '2023-04-01', value: 200 },
        { date: '2023-05-01', value: 600 },
      ]
      setData(json);
    }
    loadData();
  }, []);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
