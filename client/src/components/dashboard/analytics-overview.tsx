import { useQuery } from "@tanstack/react-query";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { TrendingUp, ChevronDown } from "lucide-react";
import { externalApiRequest } from "@/lib/queryClient";
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
  assessedPersonName: string;
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

const DELIVERY_MANAGERS = [
  { name: "Raja", value: "Raja" },
  { name: "Ani", value: "Ani" }
];

export function AnalyticsOverview() {
  const [selectedManager, setSelectedManager] = React.useState(DELIVERY_MANAGERS[0]);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const { data: assessments, isLoading, error } = useQuery<Assessment[]>({
    queryKey: ['organizational-assessments', selectedManager.value],
    queryFn: () => externalApiRequest(
      `/api/organizational-assessments/dashboard?assessedPersonName=${selectedManager.value}&assessmentLevel=DELIVERY_MANAGER`
    ),
  });

  const handleManagerSelect = (manager: typeof DELIVERY_MANAGERS[0]) => {
    setSelectedManager(manager);
    setIsDropdownOpen(false);
  };

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Transform data for chart
  const getChartData = (): ChartData[] => {
    if (!assessments || assessments.length === 0) return [];
    
    // Find the most recent assessment for the selected manager
    const managerAssessment = assessments.find(a => a.assessedPersonName === selectedManager.value) || assessments[0];
    
    // Use trends data if available, otherwise use current assessment data
    if (managerAssessment.trends && managerAssessment.trends.length > 0) {
      return managerAssessment.trends.map(trend => ({
        date: new Date(trend.assessmentDate).toLocaleDateString(),
        Green: trend.green,
        Amber: trend.amber,
        Red: trend.red,
        total: trend.total
      }));
    }

    // Fallback to current assessment data if no trends
    return [{
      date: new Date(managerAssessment.assessmentDate).toLocaleDateString(),
      Green: managerAssessment.greenProjects,
      Amber: managerAssessment.amberProjects,
      Red: managerAssessment.redProjects,
      total: managerAssessment.totalProjects - (managerAssessment.errorProjects || 0)
    }];
  };

  const chartData = getChartData();
  const hasData = chartData.length > 0 && chartData.some(d => d.total > 0);
  const latestTotal = hasData ? chartData[chartData.length - 1].total : 0;

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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
              Project Health Trends 
            </h3>
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg shadow-sm transition font-medium border border-gray-300"
            >
              {selectedManager.name}
              <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${isDropdownOpen ? 'transform rotate-180' : ''}`} />
            </button>
            {isDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200">
                <ul className="py-1">
                  {DELIVERY_MANAGERS.map((manager) => (
                    <li key={manager.value}>
                      <button
                        onClick={() => handleManagerSelect(manager)}
                        className={`w-full text-left px-4 py-2 hover:bg-blue-50 ${
                          selectedManager.value === manager.value ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        {manager.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {!hasData ? (
          <div className="h-96 flex items-center justify-center text-gray-500">
            <p>No project status data available for {selectedManager.name}</p>
          </div>
        ) : (
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
        )}

        {hasData && (
          <div className="mt-4 text-sm text-gray-600">
            <p>Tracking RAG status across {latestTotal} projects for {selectedManager.name}.</p>
            {chartData.length > 0 && (
              <p className="mt-1">
                Latest assessment: {chartData[chartData.length - 1].date}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}