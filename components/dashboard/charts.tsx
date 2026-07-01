"use client";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

const palette = ["hsl(var(--primary))", "#22c55e", "#f59e0b", "#8b5cf6", "#64748b"];
const tooltipStyle = { borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--card-foreground))" };

export function DashboardCharts({ monthly, categories, merchants }: { monthly: Array<{ month: string; amount: number }>; categories: Array<{ name: string; value: number }>; merchants: Array<{ merchant: string; amount: number }> }) {
  return <div className="grid gap-4 xl:grid-cols-12">
    <Card className="xl:col-span-6"><CardHeader><CardTitle>Monthly spending</CardTitle></CardHeader><CardContent className="h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={monthly}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `£${v}`} /><Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(Number(v))} /><Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} /></LineChart></ResponsiveContainer></CardContent></Card>
    <Card className="xl:col-span-3"><CardHeader><CardTitle>Spending by category</CardTitle></CardHeader><CardContent className="h-72"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categories} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>{categories.map((_, index) => <Cell key={index} fill={palette[index % palette.length]} />)}</Pie><Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v}%`} /></PieChart></ResponsiveContainer></CardContent></Card>
    <Card className="xl:col-span-3"><CardHeader><CardTitle>Top merchants</CardTitle></CardHeader><CardContent className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={merchants} layout="vertical" margin={{ left: 10 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" hide /><YAxis type="category" dataKey="merchant" width={90} tickLine={false} axisLine={false} fontSize={11} /><Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(Number(v))} /><Bar dataKey="amount" fill="hsl(var(--primary))" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer></CardContent></Card>
  </div>;
}
