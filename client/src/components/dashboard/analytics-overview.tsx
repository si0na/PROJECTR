import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { TrendingUp } from "lucide-react";
import type { Project, WeeklyStatusReport } from "@shared/schema";

export function AnalyticsOverview() {
  const { data: projects } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });
  const { data: weeklyReports } = useQuery<WeeklyStatusReport[]>({
    queryKey: ['/api/weekly-reports'],
  });

  // Calculate weekly trend
  const getWeeklyTrend = () => {
    if (!projects || !weeklyReports) return [];
    const last8Weeks = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - i * 7);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      const weekReports = weeklyReports.filter(report => {
        const reportDate = new Date(report.createdAt!);
        return reportDate >= weekStart && reportDate <= weekEnd;
      });
      const ragCounts = { Green: 0, Amber: 0, Red: 0 };
      weekReports.forEach(report => {
        const project = projects.find(p => p.id === report.projectId);
        if (project && project.ragStatus) {
          ragCounts[project.ragStatus as keyof typeof ragCounts]++;
        }
      });
      last8Weeks.push({
        week: `W${i + 1}`,
        Green: ragCounts.Green,
        Amber: ragCounts.Amber,
        Red: ragCounts.Red
      });
    }
    return last8Weeks;
  };

  const trendData = getWeeklyTrend();

  return (
    <div className="w-full">
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100 shadow-lg p-10 my-4">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Weekly Trends</h3>
        </div>
        {trendData.length > 0 ? (
          <div className="h-96 flex items-center justify-center">
            <ResponsiveContainer width="95%" height="100%">
              <LineChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="week" stroke="#6b7280" fontSize={14} />
                <YAxis stroke="#6b7280" fontSize={14} />
                <Tooltip />
                <Legend verticalAlign="top" height={36}/>
                <Line type="monotone" dataKey="Green" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="Amber" stroke="#f59e0b" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="Red" stroke="#ef4444" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-96 flex items-center justify-center text-gray-500">
            <p>No trend data available</p>
          </div>
        )}
      </div>
    </div>
  );
}