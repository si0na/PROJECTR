import { useQuery } from "@tanstack/react-query";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { TrendingUp } from "lucide-react";

interface Project {
  projectId: number;
  projectName: string;
  projectStatuses?: ProjectStatus[];
}

interface ProjectStatus {
  statusId: string;
  reportingDate: string;
  ragStatus: 'Green' | 'Amber' | 'Yellow' | 'Red';
}

interface WeeklyTrendData {
  week: string;
  date: string;
  Green: number;
  Amber: number;
  Red: number;
  total: number;
}

export function AnalyticsOverview() {
  const { data: projects } = useQuery<Project[]>({
    queryKey: ['/api/projects/external'],
  });
   console.log('Fetched projects:', projects);

  // Calculate weekly trend from project statuses
  const getWeeklyTrend = (): WeeklyTrendData[] => {
    if (!projects) return [];

    // First, organize all projects with their latest status per week
    const weeklyGroups: Record<string, {
      projects: Record<number, 'Green' | 'Amber' | 'Red'> // projectId → status
    }> = {};

    projects.forEach(project => {
      if (!project.projectStatuses || project.projectStatuses.length === 0) return;

      // Sort statuses by date (newest first)
      const sortedStatuses = [...project.projectStatuses].sort((a, b) => 
        new Date(b.reportingDate).getTime() - new Date(a.reportingDate).getTime()
      );

      // Group by week of the year
      sortedStatuses.forEach(status => {
        const statusDate = new Date(status.reportingDate);
        const weekNumber = getWeekNumber(statusDate);
        const weekKey = `${statusDate.getFullYear()}-W${weekNumber}`;

        if (!weeklyGroups[weekKey]) {
          weeklyGroups[weekKey] = { projects: {} };
        }

        // Only keep the most recent status for each project in each week
        if (!weeklyGroups[weekKey].projects[project.projectId]) {
          weeklyGroups[weekKey].projects[project.projectId] = 
            status.ragStatus === 'Yellow' ? 'Amber' : status.ragStatus;
        }
      });
    });

    // Helper function to get ISO week number
    function getWeekNumber(date: Date): number {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
      const week1 = new Date(d.getFullYear(), 0, 4);
      return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    }

    // Convert to chart data format (last 8 weeks)
    const sortedWeeks = Object.keys(weeklyGroups).sort();
    return sortedWeeks.slice(-8).map((weekKey, index) => {
      const weekData = weeklyGroups[weekKey];
      const counts = { Green: 0, Amber: 0, Red: 0 };

      Object.values(weekData.projects).forEach(status => {
        counts[status]++;
      });

      return {
        week: `W${index + 1}`,
        date: weekKey,
        ...counts,
        total: Object.keys(weekData.projects).length
      };
    });
  };

  const trendData = getWeeklyTrend();

  // Debug log to verify counts
  console.log('Total projects:', projects?.length);
  console.log('Weekly trend data:', trendData);

  return (
    <div className="w-full">
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100 shadow-lg p-10 my-4">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Project Health Trends (Last 8 Weeks)</h3>
        </div>
        {trendData.length > 0 ? (
          <div className="h-96 flex items-center justify-center">
            <ResponsiveContainer width="95%" height="100%">
              <LineChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="week" 
                  stroke="#6b7280" 
                  fontSize={14} 
                  label={{ value: 'Week', position: 'insideBottomRight', offset: -5 }}
                />
                <YAxis 
                  stroke="#6b7280" 
                  fontSize={14} 
                  label={{ value: '# Projects', angle: -90, position: 'insideLeft' }}
                  domain={[0, projects?.length || 10]} // Set Y-axis max to project count
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  formatter={(value: number, name: string) => [`${value} projects`, name]} 
                  labelFormatter={(label: string) => `Week ${label.replace('W', '')}`}
                />
                <Legend verticalAlign="top" height={36}/>
                <Line 
                  type="monotone" 
                  dataKey="Green" 
                  name="Green" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  dot={{ r: 5 }} 
                  activeDot={{ r: 8 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="Amber" 
                  name="Amber" 
                  stroke="#f59e0b" 
                  strokeWidth={3} 
                  dot={{ r: 5 }} 
                  activeDot={{ r: 8 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="Red" 
                  name="Red" 
                  stroke="#ef4444" 
                  strokeWidth={3} 
                  dot={{ r: 5 }} 
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-96 flex items-center justify-center text-gray-500">
            <p>No project status data available</p>
          </div>
        )}
        <div className="mt-4 text-sm text-gray-600">
          <p>Tracking RAG status across {projects?.length || 0} projects using their latest weekly status reports.</p>
        </div>
      </div>
    </div>
  );
}