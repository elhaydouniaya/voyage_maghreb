"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import ChartContainer from "@/components/admin/ChartContainer";

type ChartData = {
  weeklyBookings: { label: string; count: number }[];
  agencyPerformance: { name: string; bookings: number }[];
  topDestinations: { name: string; trips: number }[];
};

export default function AdminCharts() {
  const [data, setData] = useState<ChartData | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((res) => res.json())
      .then((d) => {
        if (d.weeklyBookings) setData(d);
      })
      .catch(() => setData(null));
  }, []);

  if (!data) {
    return (
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center py-12">
        Chargement des graphiques...
      </p>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8 mb-12">
      <div className="bg-white rounded-[3rem] border border-gray-100 p-8 shadow-sm lg:col-span-2">
        <h3 className="text-lg font-black text-[#0F172A] mb-6">
          Réservations confirmées par semaine
        </h3>
        <ChartContainer>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <LineChart data={data.weeklyBookings}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#ea580c"
                strokeWidth={3}
                dot={{ fill: "#ea580c" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <div className="bg-white rounded-[3rem] border border-gray-100 p-8 shadow-sm">
        <h3 className="text-lg font-black text-[#0F172A] mb-6">Top agences (réservations)</h3>
        <ChartContainer>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={data.agencyPerformance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 9 }} />
              <Tooltip />
              <Bar dataKey="bookings" fill="#2563eb" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <div className="bg-white rounded-[3rem] border border-gray-100 p-8 shadow-sm">
        <h3 className="text-lg font-black text-[#0F172A] mb-6">Destinations publiées</h3>
        <ChartContainer>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={data.topDestinations}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="trips" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
}
