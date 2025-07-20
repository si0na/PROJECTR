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
  errorProjects: number; // Added error projects count
  totalProjects: number;
  trends: {
    assessmentDate: string;
    green: number;
    amber: number;
    red: number;
    error: number; // Added error count in trends
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
        total: trend.total - (trend.error || 0) // Exclude error projects from total
      })) || []
    );

    // If no trends data, use the main assessment data points
    if (allTrends.length === 0) {
      return assessments.map(assessment => ({
        date: assessment.assessmentDate,
        Green: assessment.greenProjects,
        Amber: assessment.amberProjects,
        Red: assessment.redProjects,
        total: assessment.totalProjects - (assessment.errorProjects || 0)
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

  // Calculate RAG status for assessment ID 5 excluding error projects
  const getAssessment5RAGStatus = (): RAGStatus | null => {
    if (!assessments) return null;

    const assessment5 = assessments.find(a => a.assessmentId === 5);
    if (!assessment5) return null;

    // Exclude error projects from total
    const totalValidProjects = assessment5.totalProjects - (assessment5.errorProjects || 0);
    
    if (totalValidProjects <= 0) return null;

    return {
      greenPercentage: (assessment5.greenProjects / totalValidProjects) * 100,
      amberPercentage: (assessment5.amberProjects / totalValidProjects) * 100,
      redPercentage: (assessment5.redProjects / totalValidProjects) * 100,
      totalValidProjects: totalValidProjects,
      totalProjects: assessment5.totalProjects
    };
  };

  const trendData = getTrendData();
  const totalProjects = assessments?.[0]?.totalProjects || 0;
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

        {/* Assessment ID 5 RAG Status Card */}
        {ragStatus && (
          <div className="mt-8 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
            <h4 className="font-medium text-gray-900 mb-4 text-lg">Assessment ID 5 Status Breakdown</h4>
            <p className="text-sm text-gray-600 mb-4">
              Showing valid projects only (excluding error status). Based on {ragStatus.totalValidProjects} projects (out of {ragStatus.totalProjects} total).
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