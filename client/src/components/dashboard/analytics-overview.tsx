import { useQuery } from "@tanstack/react-query";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { TrendingUp } from "lucide-react";
import React from "react";

interface AssessmentTrend {
  assessmentDate: string;
  green: number;
  amber: number;
  red: number;
  total: number;
}

interface Assessment {
  assessmentId: number;
  assessedPerson: {
    userId: string;
    name: string;
  };
  assessmentDate: string;
  greenProjects: number;
  amberProjects: number;
  redProjects: number;
  errorProjects: number;
  totalProjects: number;
  trends: AssessmentTrend[];
}

interface ChartData {
  date: string;
  Green: number;
  Amber: number;
  Red: number;
  total: number;
}

interface AnalyticsOverviewProps {
  selectedPerson: { userId: string; name: string };
}

export function AnalyticsOverview({ selectedPerson }: AnalyticsOverviewProps) {
  // Enhanced logging function
  const logApiCall = (url: string, response: any, error?: any) => {
    console.group('API Call Details');
    console.log('Endpoint:', url);
    console.log('Request:', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Response:', response);
    }
    console.groupEnd();
  };

  if (!selectedPerson?.userId) {
    console.log('No user selected - showing fallback UI');
    return (
      <div className="w-full">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100 shadow-lg p-10 my-4">
          <div className="h-96 flex items-center justify-center text-gray-500">
            <p>Please select a user to view project health data.</p>
          </div>
        </div>
      </div>
    );
  }

  const { data: assessment, isLoading, error } = useQuery<Assessment>({
    queryKey: ['assessment', selectedPerson.userId],
    queryFn: async () => {
      const url = `http://34.63.198.88:8080/api/assessments/dashboard?assessedPersonUserId=${selectedPerson.userId}`;
      console.log('Making API call to:', url);
      
      try {
        const response = await fetch(url);
        if (!response.ok) {
          const errorData = {
            status: response.status,
            statusText: response.statusText,
            url: response.url
          };
          logApiCall(url, null, errorData);
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        logApiCall(url, data);
        return data;
      } catch (err) {
        logApiCall(url, null, err);
        throw err;
      }
    },
    enabled: !!selectedPerson.userId,
    retry: 1
  });

  const getChartData = (): ChartData[] => {
    if (!assessment || !Array.isArray(assessment)) {
      console.log('No valid assessment data');
      return [];
    }

    // Process all assessments into chart data
    const allChartData: ChartData[] = [];

    assessment.forEach((assess: Assessment) => {
      // Use trends if available, otherwise fall back to main assessment data
      if (assess.trends?.length > 0) {
        assess.trends.forEach((trend: AssessmentTrend) => {
          allChartData.push({
            date: new Date(trend.assessmentDate).toLocaleDateString(),
            Green: trend.green,
            Amber: trend.amber,
            Red: trend.red,
            total: trend.total
          });
        });
      } else {
        allChartData.push({
          date: new Date(assess.assessmentDate).toLocaleDateString(),
          Green: assess.greenProjects,
          Amber: assess.amberProjects,
          Red: assess.redProjects,
          total: assess.totalProjects - (assess.errorProjects || 0)
        });
      }
    });

    // Sort by date (newest first)
    return allChartData.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  const chartData = getChartData();
  const hasData = chartData.length > 0;
  
  console.log('Chart data prepared:', {
    chartData,
    hasData,
    assessment,
    error
  });

  if (isLoading) {
    console.log('Loading state - showing spinner');
    return (
      <div className="h-96 flex items-center justify-center">
        <p>Loading project health data...</p>
      </div>
    );
  }

  if (error) {
    console.error('Error state:', error);
    return (
      <div className="h-96 flex items-center justify-center text-red-500">
        <p>Error loading project health data</p>
        <p className="text-sm mt-2">{(error as Error).message}</p>
      </div>
    );
  }

  if (!hasData) {
    console.log('No data state - showing empty message');
    return (
      <div className="h-96 flex items-center justify-center text-gray-500">
        <p>No project status data available for {selectedPerson.name}</p>
      </div>
    );
  }

  console.log('Rendering chart with data');
  return (
    <div className="w-full">
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100 shadow-lg p-10 my-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
              Project Health Trends
            </h3>
          </div>
        </div>

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
                stroke="#facc15"
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

        <div className="mt-4 text-sm text-gray-600">
          <p>Tracking RAG status across {chartData[chartData.length - 1].total} projects for {selectedPerson.name}.</p>
          <p className="mt-1">
            Latest assessment: {chartData[chartData.length - 1].date}
          </p>
        </div>
      </div>
    </div>
  );
}