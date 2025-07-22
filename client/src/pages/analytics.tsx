import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  Legend
} from "recharts";
import { 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  Activity, 
  Brain, 
  Download,
  Users,
  Shield,
  TrendingDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { getISOWeek } from 'date-fns';

// Define types for our data structures
type Project = {
  id: string;
  isActive: boolean;
  tower?: string;
};

type WeeklyReport = {
  projectId: string;
  reportingDate: string;
  healthCurrentWeek: 'Green' | 'Amber' | 'Red';
  createdAt: string;
  ragStatus: 'Green' | 'Amber' | 'Red';
};

type PortfolioAnalysis = {
  projectsAnalyzed?: {
    summary?: {
      red_projects?: number;
      amber_projects?: number;
      green_projects?: number;
      no_recent_reports?: number;
    };
    sample_critical_projects?: Array<{
      project_name: string;
      ai_status: string;
      ai_assessment_description: string;
      escalation_required: boolean;
    }>;
  };
  overallPortfolioRagStatus?: string;
  reason?: string;
};

type ProjectMetrics = {
  totalProjects: number;
  activeProjects: number;
  atRiskProjects: number;
  portfolioHealth?: string;
  projectSummary: {
    red_projects?: number;
    amber_projects?: number;
    green_projects?: number;
    no_recent_reports?: number;
  };
  criticalProjects: Array<{
    project_name: string;
    ai_status: string;
    ai_assessment_description: string;
    escalation_required: boolean;
  }>;
  reason: string;
  weeklyReports: WeeklyReport[];
};

type RagTrendDataPoint = {
  name: string;
  Green: number;
  Amber: number;
  Red: number;
  total: number;
};

type TowerPerformanceData = {
  name: string;
  Green: number;
  Amber: number;
  Red: number;
  totalProjects: number;
  greenPercentage: number;
  amberPercentage: number;
  redPercentage: number;
};

const COLORS = {
  Green: "#10B981",
  Amber: "#F59E0B",
  Red: "#EF4444"
};

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("3months");

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects/external/"],
  });

  const { data: weeklyReports } = useQuery<WeeklyReport[]>({
    queryKey: ["/api/weekly-reports"],
  });

  const { data: portfolioAnalysis } = useQuery<PortfolioAnalysis>({
    queryKey: ["/api/portfolio-analysis"],
  });

  // Get project metrics from API data
  const getProjectMetrics = (): ProjectMetrics | null => {
    if (!projects || !weeklyReports || !portfolioAnalysis) return null;

    const totalProjects = projects.length;
    const activeProjects = projects.filter((p: Project) => p.isActive).length;
    const atRiskProjects = (portfolioAnalysis.projectsAnalyzed?.summary?.red_projects || 0) + 
                         (portfolioAnalysis.projectsAnalyzed?.summary?.amber_projects || 0);

    return {
      totalProjects,
      activeProjects,
      atRiskProjects,
      portfolioHealth: portfolioAnalysis.overallPortfolioRagStatus,
      projectSummary: portfolioAnalysis.projectsAnalyzed?.summary || {},
      criticalProjects: portfolioAnalysis.projectsAnalyzed?.sample_critical_projects || [],
      reason: portfolioAnalysis.reason || "",
      weeklyReports
    };
  };

  // Extract key risk areas from the reason text
  const getKeyRiskAreas = (reason: string): string[] => {
    if (!reason) return [];
    const riskAreas: string[] = [];
    if (reason.includes("legacy system integrations")) riskAreas.push("Legacy system integrations");
    if (reason.includes("resource allocation")) riskAreas.push("Resource allocation");
    if (reason.includes("third-party dependency")) riskAreas.push("Third-party dependencies");
    return riskAreas.length > 0 ? riskAreas : ["Multiple risk factors identified"];
  };

  // Extract primary recommendation from reason text
  const getPrimaryRecommendation = (reason: string): string => {
    if (!reason) return "Review portfolio and address critical issues immediately";
    
    // First try to find explicit recommendation
    const recommendationMatch = reason.match(/Recommend (.+?)(\.|$)/i);
    if (recommendationMatch) return recommendationMatch[1];
    
    // Fallback to finding action items
    const actionMatch = reason.match(/focus(.+?)(\.|$)/i) || 
                       reason.match(/attention(.+?)(\.|$)/i) ||
                       reason.match(/address(.+?)(\.|$)/i);
    
    return actionMatch 
      ? `Focus on ${actionMatch[1].trim()}`
      : "Review portfolio and address critical issues immediately";
  };

  // Improved RAG Status Trend Data from weekly reports
  const getRagTrendData = () => {
  if (!weeklyReports) return [];

  const last12Weeks = [];
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (i * 7));
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
      ragCounts[report.ragStatus as keyof typeof ragCounts]++;
    });

    last12Weeks.push({
      week: `W${12 - i}`,
      date: weekStart.toLocaleDateString(),
      Green: ragCounts.Green,
      Amber: ragCounts.Amber,
      Red: ragCounts.Red,
      total: ragCounts.Green + ragCounts.Amber + ragCounts.Red
    });
  }

  return last12Weeks;
};


  // Improved Tower Performance Data
  const getTowerPerformanceData = () => {
  if (!projects || !weeklyReports) return [];

  const towerData: { [key: string]: any } = {};

  projects.forEach(project => {
    if (!project.tower) return;

    const tower = project.tower;
    if (!towerData[tower]) {
      towerData[tower] = {
        tower,
        totalProjects: 0,
        greenProjects: 0,
        amberProjects: 0,
        redProjects: 0,
        totalReports: 0
      };
    }
    towerData[tower].totalProjects++;

    const projectReports = weeklyReports.filter(r => r.projectId === project.id);
    const latestReport = projectReports.sort((a, b) =>
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    )[0];

    towerData[tower].totalReports += projectReports.length;

    if (latestReport?.ragStatus === 'Green') towerData[tower].greenProjects++;
    else if (latestReport?.ragStatus === 'Amber') towerData[tower].amberProjects++;
    else if (latestReport?.ragStatus === 'Red') towerData[tower].redProjects++;
  });
return Object.values(towerData).map(tower => {
  const total = tower.greenProjects + tower.amberProjects + tower.redProjects || 1; // avoid divide-by-zero

  return {
    name: tower.tower,
    Green: tower.greenProjects,
    Amber: tower.amberProjects,
    Red: tower.redProjects,
    totalProjects: tower.totalProjects,
    greenPercentage: parseFloat(((tower.greenProjects / total) * 100).toFixed(1)),
    amberPercentage: parseFloat(((tower.amberProjects / total) * 100).toFixed(1)),
    redPercentage: parseFloat(((tower.redProjects / total) * 100).toFixed(1))
  };
});

};


  const projectMetrics = getProjectMetrics();
  const ragTrendData = getRagTrendData();
  const towerPerformanceData = getTowerPerformanceData();
  const keyRiskAreas = projectMetrics ? getKeyRiskAreas(projectMetrics.reason) : [];
  const primaryRecommendation = projectMetrics ? getPrimaryRecommendation(projectMetrics.reason) : "";

  const exportAnalytics = () => {
    const data = {
      projectMetrics,
      ragTrendData,
      towerPerformanceData,
      generatedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics & Insights</h1>
            <p className="text-gray-600 mt-1">
              Project portfolio analysis and trend insights
            </p>
          </div>
          <div className="flex space-x-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">Last Month</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportAnalytics} className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export Report</span>
            </Button>
          </div>
        </div>

        {/* Primary AI Recommendation */}
        {primaryRecommendation && (
          <Card className="rounded-2xl mb-8 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-indigo-800">
                <Brain className="h-5 w-5" />
                <span>AI Recommendation</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-white rounded-lg border border-indigo-100 shadow-sm">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    1
                  </div>
                  <p className="text-indigo-800 font-medium">{primaryRecommendation}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        {projectMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Projects */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-blue-700 flex items-center">
                  <Activity className="h-4 w-4 mr-2" />
                  Total Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">{projectMetrics.totalProjects}</div>
                <p className="text-sm text-blue-600">Across all towers</p>
              </CardContent>
            </Card>

            {/* Active Projects */}
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-700 flex items-center">
                  <Target className="h-4 w-4 mr-2" />
                  Active Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">{projectMetrics.activeProjects}</div>
                <p className="text-sm text-green-600">Currently in progress</p>
              </CardContent>
            </Card>

            {/* At Risk/Escalations */}
            <Card className="bg-gradient-to-r from-red-50 to-rose-50 border-red-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-red-700 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  At Risk Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-900">{projectMetrics.atRiskProjects}</div>
                <p className="text-sm text-red-600">Red + Amber status</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Portfolio Summary */}
        {projectMetrics?.projectSummary && (
          <Card className="rounded-2xl mb-8 bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-slate-800">
                <Brain className="h-5 w-5" />
                <span>Portfolio Analysis Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {projectMetrics.projectSummary.red_projects || 0}
                  </div>
                  <div className="text-sm text-gray-600">Red Projects</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-amber-600">
                    {projectMetrics.projectSummary.amber_projects || 0}
                  </div>
                  <div className="text-sm text-gray-600">Amber Projects</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {projectMetrics.projectSummary.green_projects || 0}
                  </div>
                  <div className="text-sm text-gray-600">Green Projects</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">
                    {projectMetrics.projectSummary.no_recent_reports || 0}
                  </div>
                  <div className="text-sm text-gray-600">No Recent Reports</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Improved RAG Status Trend */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <span>Weekly RAG Status Trend</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {ragTrendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ragTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="Green" 
                        stroke={COLORS.Green} 
                        strokeWidth={2} 
                        name="Green"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="Amber" 
                        stroke={COLORS.Amber} 
                        strokeWidth={2} 
                        name="Amber"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="Red" 
                        stroke={COLORS.Red} 
                        strokeWidth={2} 
                        name="Red"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No weekly report data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Improved Tower Performance */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-600" />
                <span>Tower Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {towerPerformanceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={towerPerformanceData}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip 
                        formatter={(value, name) => [`${value}%`, name]}
                        labelFormatter={(label) => `Tower ${label}`}
                      />
                      <Legend />
<Bar dataKey="greenPercentage" fill={COLORS.Green} name="Green" stackId="a" />
<Bar dataKey="amberPercentage" fill={COLORS.Amber} name="Amber" stackId="a" />
<Bar dataKey="redPercentage" fill={COLORS.Red} name="Red" stackId="a" />

                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No tower performance data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Risk Areas */}
        {keyRiskAreas.length > 0 && (
          <Card className="rounded-2xl bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-yellow-800">
                <Shield className="h-5 w-5" />
                <span>Key Risk Areas</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {keyRiskAreas.map((risk, idx) => (
                  <div key={idx} className="p-4 bg-white rounded-lg border border-yellow-100">
                    <div className="flex items-start space-x-2">
                      <TrendingDown className="h-5 w-5 text-yellow-600 mt-1 flex-shrink-0" />
                      <p className="text-yellow-800 font-medium">{risk}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

         {/* Critical Projects */}
{(projectMetrics?.criticalProjects?.length ?? 0) > 0 &&(
          <Card className="rounded-2xl bg-gradient-to-r from-red-50 to-rose-100 border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                <span>Critical Projects Requiring Attention</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {projectMetrics?.criticalProjects?.map
((proj, idx) => (
                <div key={idx} className="p-4 bg-white rounded-lg shadow-sm border border-red-100">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-red-700">{proj.project_name}</h4>
                    <Badge variant="destructive">{proj.ai_status}</Badge>
                  </div>
                  <p className="text-sm text-gray-700 mb-1">
                    <strong>Issue:</strong> {proj.ai_assessment_description}
                  </p>
                  <p className="text-sm text-red-600">
                    <strong>Recommendation:</strong>{" "}
                    {proj.escalation_required ? "Escalate immediately" : "Monitor closely"}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}