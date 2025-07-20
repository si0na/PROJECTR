import { useQuery } from "@tanstack/react-query";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { TrendingUp } from "lucide-react";
import { externalApiRequest } from "@/lib/queryClient";

interface Assessment {
  assessmentId: number;
  assessmentDate: string;
  greenProjects: number;
  amberProjects: number;
  redProjects: number;
  totalProjects: number;
  trends: {
    assessmentDate: string;
    green: number;
    amber: number;
    red: number;
    total: number;
  }[];
}

interface TrendData {
  date: string;
  Green: number;
  Amber: number;
  Red: number;
  total: number;
}

export function AnalyticsOverview() {
  const { data: assessments, isLoading, error } = useQuery<Assessment[]>({
    queryKey: ['organizational-assessments'],
    queryFn: () => externalApiRequest('/api/organizational-assessments/dashboard'),
  });

  console.log('Fetched assessments:', assessments);

  // Transform assessment data into chart format
  const getTrendData = (): TrendData[] => {
    if (!assessments) return [];

    // Collect all trend entries from all assessments
    const allTrends = assessments.flatMap(assessment => 
      assessment.trends?.map(trend => ({
        date: trend.assessmentDate,
        Green: trend.green,
        Amber: trend.amber,
        Red: trend.red,
        total: trend.total
      })) || []
    );

    // If no trends data, use the main assessment data points
    if (allTrends.length === 0) {
      return assessments.map(assessment => ({
        date: assessment.assessmentDate,
        Green: assessment.greenProjects,
        Amber: assessment.amberProjects,
        Red: assessment.redProjects,
        total: assessment.totalProjects
      }));
    }

    // Remove duplicates by keeping the most recent entry for each date
    const uniqueTrends = allTrends.reduce((acc, current) => {
      const existing = acc.find(item => item.date === current.date);
      if (!existing) {
        acc.push(current);
      }
      return acc;
    }, [] as TrendData[]);

    // Sort by date
    return uniqueTrends.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  const trendData = getTrendData();
  const totalProjects = assessments?.[0]?.totalProjects || 0;

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100 shadow-lg p-10 my-4">
          <div className="h-96 flex items-center justify-center">
            <p>Loading project health data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100 shadow-lg p-10 my-4">
          <div className="h-96 flex items-center justify-center text-red-500">
            <p>Error loading project health data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100 shadow-lg p-10 my-4">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Project Health Trends</h3>
        </div>
        {trendData.length > 0 ? (
          <div className="h-96 flex items-center justify-center">
            <ResponsiveContainer width="95%" height="100%">
              <LineChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date"
                  stroke="#6b7280"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                  label={{ value: '', position: 'insideBottomRight', offset: -5 }}
                />
                <YAxis 
                  stroke="#6b7280" 
                  fontSize={14} 
                  label={{ value: '# Projects', angle: -90, position: 'insideLeft' }}
                  domain={[0, totalProjects || 10]}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '8px', 
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    backgroundColor: '#fff'
                  }}
                  formatter={(value: number, name: string) => [`${value} projects`, name]} 
                  labelFormatter={(label: string) => `Date: ${label}`}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  wrapperStyle={{ paddingBottom: '20px' }}
                />
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
          <p>Tracking RAG status across {totalProjects} projects using assessment data.</p>
          {assessments && assessments.length > 0 && (
            <p className="mt-1">
              Latest assessment: {new Date(assessments[0].assessmentDate).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}