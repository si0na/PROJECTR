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
  errorProjects: number;
  totalProjects: number;
  trends: {
    assessmentDate: string;
    green: number;
    amber: number;
    red: number;
    error: number;
    total: number;
  }[];
}

interface ChartData {
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

  // Get Assessment ID 5 data
  const assessment5 = assessments?.find(a => a.assessmentId === 5);

  // Transform data for chart
  const getChartData = (): ChartData[] => {
    if (!assessment5) return [];

    // If trends data exists, use it
    if (assessment5.trends && assessment5.trends.length > 0) {
      return assessment5.trends.map(trend => ({
        date: trend.assessmentDate,
        Green: trend.green,
        Amber: trend.amber,
        Red: trend.red,
        total: trend.total - (trend.error || 0)
      }));
    }

    // Default to showing current assessment data
    return [{
      date: assessment5.assessmentDate,
      Green: assessment5.greenProjects,
      Amber: assessment5.amberProjects,
      Red: assessment5.redProjects,
      total: assessment5.totalProjects - (assessment5.errorProjects || 0)
    }];
  };

  const chartData = getChartData();
  const hasData = assessment5 && (assessment5.totalProjects > 0 || (assessment5.trends && assessment5.trends.length > 0));

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
          <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
            Project Health Trends 
          </h3>
        </div>

        {!assessment5 ? (
          <div className="h-96 flex items-center justify-center text-gray-500">
            <p>Assessment ID 5 not found</p>
          </div>
        ) : hasData ? (
          <div className="h-96 flex items-center justify-center">
            <ResponsiveContainer width="95%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date"
                  stroke="#6b7280"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis 
                  stroke="#6b7280" 
                  fontSize={14} 
                  label={{ value: '# Projects', angle: -90, position: 'insideLeft' }}
                  domain={[0, Math.max(10, ...chartData.map(d => d.total))]}
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
            <p>No project status data available for Assessment ID 5</p>
          </div>
        )}

        {assessment5 && (
          <div className="mt-4 text-sm text-gray-600">
            <p>Tracking RAG status across {assessment5.totalProjects} projects using assessment data.</p>
            <p className="mt-1">
              Latest assessment: {new Date(assessment5.assessmentDate).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}