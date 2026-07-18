"use client";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Fade } from "react-awesome-reveal";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { Skeleton } from "@/components/ui/Skeleton";

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await axios.get("/api/dashboard");
      setData(res.data);
    } catch {
      // keep old data
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 60000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  if (initialLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="bg-white p-4 rounded-2xl shadow">
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="bg-white p-4 rounded-2xl shadow">
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="bg-white p-4 rounded-2xl shadow">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!data)
    return (
      <div className="flex items-center justify-center h-full">
        <p>Error loading dashboard.</p>
      </div>
    );

  const { cards, today, yesterday, thisMonth, year, yearly } = data;

  const todayVsYesterday = [
    { name: "Today", In: today.in, Out: today.out },
    { name: "Yesterday", In: yesterday.in, Out: yesterday.out },
  ];

  const yearlyChart = yearly.map((y: any) => ({
    name: y.year.toString(),
    In: y.in,
    Out: y.out,
  }));

  return (
    <div className="space-y-6">
      <Fade cascade damping={0.1} triggerOnce>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            {
              label: "Total Clients",
              value: cards.totalClients,
              color: "bg-blue-500",
            },
            {
              label: "Total Orders",
              value: cards.totalOrders,
              color: "bg-indigo-500",
            },
            {
              label: "Pending Orders",
              value: cards.pendingOrders,
              color: "bg-yellow-500",
            },
            {
              label: "Due Amount",
              value: `৳ ${cards.dueAmount}`,
              color: "bg-red-500",
            },
            {
              label: "Month Success",
              value: cards.thisMonthSuccess,
              color: "bg-green-500",
            },
            {
              label: "Last Cash Balance",
              value: `৳ ${cards.lastCashAmount}`,
              color: "bg-purple-500",
            },
          ].map((card) => (
            <div
              key={card.label}
              className={`${card.color} text-white p-4 rounded-xl shadow`}
            >
              <p className="text-xs opacity-90">{card.label}</p>
              <p className="text-2xl font-bold mt-1">{card.value}</p>
            </div>
          ))}
        </div>
      </Fade>

      <div className="bg-white p-4 rounded-2xl shadow">
        <h3 className="text-lg font-semibold mb-4">
          Today vs Yesterday In/Out
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={todayVsYesterday}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="In" fill="#4caf50" />
            <Bar dataKey="Out" fill="#f44336" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow">
        <h3 className="text-lg font-semibold mb-4">This Month In/Out</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={thisMonth}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="in" name="In" fill="#4caf50" />
            <Bar dataKey="out" name="Out" fill="#f44336" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow">
        <h3 className="text-lg font-semibold mb-4">
          Yearly In/Out ({new Date().getFullYear()})
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={year.map((m: any) => ({
              ...m,
              name: monthNames[m.month - 1],
            }))}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="in" name="In" stroke="#4caf50" />
            <Line type="monotone" dataKey="out" name="Out" stroke="#f44336" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow">
        <h3 className="text-lg font-semibold mb-4">Multi-Year In/Out</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={yearlyChart}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="In" fill="#4caf50" />
            <Bar dataKey="Out" fill="#f44336" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
