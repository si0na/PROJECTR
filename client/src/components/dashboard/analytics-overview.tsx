import { useQuery } from "@tanstack/react-query";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
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

interface RAGStatus {
  greenPercentage: number;
  amberPercentage: number;
  redPercentage: number;
  totalValidProjects: number;
  totalProjects: number;
}

export function AnalyticsOverview() {
  const { data: assessments, isLoading, error } = useQuery<Assessment[]>({
    queryKey: ['organizational-assessments'],
    queryFn: () => externalApiRequest('/api/organizational-assessments/dashboard'),
  });

  // Get Assessment ID 5 data
  const assessment5 = assessments?.find(a => a.assessmentId === 5);

  // Transform data for chart - always returns at least one data point
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

    // Default to showing current assessment data (even if zeros)
    return [{
      date: assessment5.assessmentDate,
      Green: assessment5.greenProjects,
      Amber: assessment5.amberProjects,
      Red: assessment5.redProjects,
      total: assessment5.totalProjects - (assessment5.errorProjects || 0)
    }];
  };

  // Calculate RAG status percentages
  const getAssessment5RAGStatus = (): RAGStatus | null => {
    if (!assessment5) return null;

    const totalValidProjects = assessment5.totalProjects - (assessment5.errorProjects || 0);
    if (totalValidProjects <= 0) return null;

    return {
      greenPercentage: (assessment5.greenProjects / totalValidProjects) * 100,
      amberPercentage: (assessment5.amberProjects / totalValidProjects) * 100,
      redPercentage: (assessment5.redProjects / totalValidProjects) * 100,
      totalValidProjects,
      totalProjects: assessment5.totalProjects
    };
  };

  const chartData = getChartData();
  const ragStatus = getAssessment5RAGStatus();

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
            Project Health Trends {assessment5 ? `(Assessment ID 5)` : ''}
          </h3>
        </div>

        {!assessment5 ? (
          <div className="h-96 flex items-center justify-center text-gray-500">
            <p>Assessment ID 5 not found</p>
          </div>
        ) : (
          <div className="h-96 flex items-center justify-center">
            <ResponsiveContainer width="95%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
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
                <Bar 
                  dataKey="Green" 
                  name="Green" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="Amber" 
                  name="Amber" 
                  fill="#f59e0b" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="Red" 
                  name="Red" 
                  fill="#ef4444" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {assessment5 && assessment5.totalProjects === 0 ? (
          <div className="mt-8 p-6 bg-yellow-50 rounded-xl border border-yellow-200">
            <h4 className="font-medium text-gray-900 mb-2 text-lg">Assessment Status</h4>
            <p className="text-yellow-700">No projects recorded in this assessment</p>
          </div>
        ) : ragStatus ? (
          <div className="mt-8 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
            <h4 className="font-medium text-gray-900 mb-4 text-lg">Assessment ID 5 Status Breakdown</h4>
            <p className="text-sm text-gray-600 mb-4">
              Showing valid projects only (excluding error status). Based on {ragStatus.totalValidProjects} projects.
            </p>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
                <p className="text-3xl font-bold text-green-600">{ragStatus.greenPercentage.toFixed(1)}%</p>
                <p className="text-sm font-medium text-green-800 mt-1">Green</p>
                <p className="text-xs text-green-600 mt-1">({Math.round(ragStatus.greenPercentage * ragStatus.totalValidProjects / 100)} projects)</p>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-3xl font-bold text-amber-600">{ragStatus.amberPercentage.toFixed(1)}%</p>
                <p className="text-sm font-medium text-amber-800 mt-1">Amber</p>
                <p className="text-xs text-amber-600 mt-1">({Math.round(ragStatus.amberPercentage * ragStatus.totalValidProjects / 100)} projects)</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-100">
                <p className="text-3xl font-bold text-red-600">{ragStatus.redPercentage.toFixed(1)}%</p>
                <p className="text-sm font-medium text-red-800 mt-1">Red</p>
                <p className="text-xs text-red-600 mt-1">({Math.round(ragStatus.redPercentage * ragStatus.totalValidProjects / 100)} projects)</p>
              </div>
            </div>
          </div>
        ) : null}

        {assessment5 && (
          <div className="mt-4 text-sm text-gray-600">
            <p>Assessment date: {new Date(assessment5.assessmentDate).toLocaleDateString()}</p>
            {assessment5.totalProjects > 0 && (
              <p className="mt-1">Tracking {assessment5.totalProjects} projects</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}