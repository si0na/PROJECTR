import { useQuery } from "@tanstack/react-query";
import { Bot, Activity, Star, ChevronRight } from "lucide-react";
import React from "react";
import { useLocation } from "wouter";

interface ProjectStatus {
  statusId: string;
  reportingDate: string;
  projectImportance: string;
  deliveryModel: string;
  clientEscalation: boolean;
  clientEscalationDetails: string | null;
  ragStatus: string;
  keyWeeklyUpdates: string;
  weeklyUpdateColumn: string;
  llmAiStatus: string;
  llmAiAssessmentDescription: string;
  planForNextWeek: string;
  issuesChallenges: string;
  planForGreen: string;
  currentSdlcPhase: string;
  sqaRemarks: string;
}

interface Project {
  projectId: number;
  projectName: string;
  projectCodeId: string | null;
  projectManagerName: string;
  account: string;
  billingModel: string;
  tower: string;
  fte: string;
  wsrPublisYesNo: string;
  importance: string;
  isActive: boolean;
  projectReviews: any[];
  projectStatuses: ProjectStatus[];
}

interface Assessment {
  assessmentId: number;
  assessedPersonName: string;
  organizationUnit: string;
  assessmentDate: string;
  assessmentLevel: string;
  totalProjects: number;
  greenProjects: number;
  amberProjects: number;
  redProjects: number;
  projectsSummary: {
    total: number;
    statusCounts: {
      green: number;
      amber?: number;
      red?: number;
      error?: number;
    };
    importanceGroups: Record<string, Record<string, number>>;
  };
  llmOrgRagStatus: string;
  llmOrgAssessmentDescription: string;
  keyRisks: string;
  recommendedActions: string;
  escalationNeeded: boolean;
  escalationsCount: number;
  overallHealthScore: number;
  createdAt: string;
  updatedAt: string;
  trends: {
    assessmentDate: string;
    green: number;
    amber: number;
    red: number;
    total: number;
  }[];
}

interface PortfolioAnalysis {
  overallPortfolioRagStatus: string;
  reason: string;
  analysisDate: string;
  metrics: {
    green: number;
    amber: number;
    red: number;
  };
}

export function AIAssessmentHeader() {
  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects/external"],
  });
  
  const { data: assessments } = useQuery<Assessment[]>({
    queryKey: ["/api/organizational-assessments/dashboard"],
  });
  
  const [, setLocation] = useLocation();

  // Get the latest assessment from dashboard API
  const latestAssessment = assessments?.[0];

  const analysis = React.useMemo<PortfolioAnalysis | null>(() => {
    if (!projects) return null;

    // Use dashboard API data for portfolio health if available
    if (latestAssessment) {
      return {
        overallPortfolioRagStatus: latestAssessment.llmOrgRagStatus || "Green",
        reason: latestAssessment.llmOrgAssessmentDescription || "Portfolio analysis not available",
        analysisDate: latestAssessment.updatedAt || latestAssessment.assessmentDate,
        metrics: {
          green: latestAssessment.greenProjects,
          amber: latestAssessment.amberProjects,
          red: latestAssessment.redProjects + (latestAssessment.projectsSummary?.statusCounts?.error || 0)
        }
      };
    }

    // Fallback to project API data if no assessment data
    const ragCounts = projects.reduce(
      (acc, project) => {
        const latestStatus = project.projectStatuses?.[0];
        if (latestStatus?.ragStatus) {
          const status = latestStatus.ragStatus.toLowerCase();
          if (status === "green") acc.green++;
          if (status === "amber") acc.amber++;
          if (status === "red") acc.red++;
        }
        return acc;
      },
      { green: 0, amber: 0, red: 0 }
    );

    const total = ragCounts.green + ragCounts.amber + ragCounts.red;
    const greenPercentage = total > 0 ? Math.round((ragCounts.green / total) * 100) : 0;

    let overallStatus = "Green";
    if (ragCounts.red > 0) overallStatus = "Red";
    else if (ragCounts.amber > total * 0.3) overallStatus = "Amber";

    const highRiskProjects = projects
      .filter(p => p.projectStatuses?.[0]?.ragStatus === "Red")
      .map(p => p.projectName);

    const amberProjects = projects
      .filter(p => p.projectStatuses?.[0]?.ragStatus === "Amber")
      .map(p => p.projectName);

    const reason = [
      `Portfolio analysis shows ${greenPercentage}% of projects are Green.`,
      ...(ragCounts.red > 0 ? [`High risk projects (Red): ${highRiskProjects.join(", ")}. Immediate attention required.`] : []),
      ...(ragCounts.amber > 0 ? [`Projects needing monitoring (Amber): ${amberProjects.join(", ")}.`] : []),
      "Recommend focusing on resolving critical issues in Red projects first, then address Amber project risks."
    ].join(" ");

    return {
      overallPortfolioRagStatus: overallStatus,
      reason: reason.trim(),
      analysisDate: new Date().toISOString(),
      metrics: ragCounts
    };
  }, [projects, latestAssessment]);

  // Calculate strategic projects count from dashboard API importanceGroups
  const strategicCount = latestAssessment?.projectsSummary?.importanceGroups?.strategic
    ? Object.entries(latestAssessment.projectsSummary.importanceGroups.strategic)
        .map(([status, count]) => count)
        .reduce((a, b) => a + b, 0)
    : projects?.filter(p => p.projectStatuses?.[0]?.projectImportance === "Strategic").length || 0;

  const getPrimaryRecommendation = (reason: string): string => {
    if (!reason) return "Review portfolio and address critical issues immediately";

    // Use first recommendation from dashboard API if available
    if (latestAssessment?.recommendedActions) {
      const firstAction = latestAssessment.recommendedActions.split('\n')[0];
      return firstAction.replace(/^•\s*Action \d+:\s*/i, '');
    }

    const recommendationMatch = reason.match(/Recommend (.+?)(\.|$)/i);
    if (recommendationMatch) return recommendationMatch[1];

    const actionMatch =
      reason.match(/focus(.+?)(\.|$)/i) ||
      reason.match(/attention(.+?)(\.|$)/i) ||
      reason.match(/address(.+?)(\.|$)/i);

    return actionMatch
      ? `Focus on ${actionMatch[1].trim()}`
      : "Review portfolio and address critical issues immediately";
  };

  const primaryRecommendation = analysis?.reason ? getPrimaryRecommendation(analysis.reason) : "";

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "green": return "bg-green-500";
      case "amber": return "bg-amber-500";
      case "red": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusBgColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "green": return "bg-green-50 border-green-200";
      case "amber": return "bg-amber-50 border-amber-200";
      case "red": return "bg-red-50 border-red-200";
      default: return "bg-gray-50 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const [selectedStatus, setSelectedStatus] = React.useState<"green" | "amber" | "red" | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const handleStatusClick = (status: "green" | "amber" | "red") => {
    setSelectedStatus(selectedStatus === status ? null : status);
  };

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSelectedStatus(null);
      }
    }
    
    if (selectedStatus) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedStatus]);

  if (!projects || !analysis) {
    return (
      <div className="p-8 text-center text-gray-600 bg-gray-50 rounded-xl">
        No portfolio analysis available.
      </div>
    );
  }

  const metrics = analysis.metrics;
  const total = metrics.green + metrics.amber + metrics.red;
  const filteredProjects = selectedStatus 
    ? projects.filter(p => p.projectStatuses?.[0]?.ragStatus?.toLowerCase() === selectedStatus)
    : [];

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-blue-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white border border-blue-200 rounded-2xl flex items-center justify-center shadow-sm">
              <Bot className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">AI Portfolio Intelligence</h2>
              <p className="text-blue-600 font-medium">Automated insights and risk analysis</p>
            </div>
          </div>
          <div className="text-xs text-gray-500 bg-white/80 px-3 py-1.5 rounded-full border border-blue-100 shadow-sm">
            Last updated: {formatDate(analysis.analysisDate)}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-blue-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Portfolio Health Card with llmOrgRagStatus */}
            <div className={`rounded-lg p-4 border-2 ${getStatusBgColor(latestAssessment?.llmOrgRagStatus || analysis.overallPortfolioRagStatus)} relative`}>
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${getStatusColor(latestAssessment?.llmOrgRagStatus || analysis.overallPortfolioRagStatus)}`}></div>
                <div>
                  <p className="font-bold text-lg text-gray-900 capitalize">
                    {latestAssessment?.llmOrgRagStatus || analysis.overallPortfolioRagStatus}
                  </p>
                  <p className="text-sm text-gray-600">Portfolio Health</p>
                </div>
              </div>
              <div className="absolute top-3 right-3 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full border border-blue-200">
                Reflections
              </div>
            </div>

            {/* Strategic Projects Card with importanceGroups data */}
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg p-4 border-2 border-yellow-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-lg flex items-center justify-center shadow-sm">
                  <Star className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-lg text-gray-900">{strategicCount}</p>
                  <p className="text-sm text-gray-600">Strategic Projects</p>
                  {latestAssessment?.projectsSummary?.importanceGroups?.strategic && (
                    <div className="text-xs text-gray-500 mt-1">
                      {Object.entries(latestAssessment.projectsSummary.importanceGroups.strategic).map(([status, count]) => (
                        <span key={status} className="mr-2">
                          {status}: {count}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Active Projects Card */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-sm">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-lg text-gray-900">{total}</p>
                  <p className="text-sm text-gray-600">Active Projects</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border-2 border-indigo-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="7" stroke="white" strokeWidth="2"/>
                  <path d="M7 10l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900">AI Analysis & Recommendations</h3>
            </div>

            <div className="text-xs text-gray-500 mb-3 flex flex-wrap gap-x-4 gap-y-1">
              <span><span className="font-medium">Last Updated:</span> {formatDate(analysis.analysisDate)}</span>
              <span><span className="font-medium">Active Projects:</span> {total}</span>
              <span><span className="font-medium">Strategic Projects:</span> {strategicCount}</span>
            </div>
            
            <div className="text-sm text-gray-700 leading-relaxed mb-4 space-y-3">
              {metrics.red > 0 && (
                <div className="bg-red-50/50 p-3 rounded-lg">
                  <span className="font-semibold text-red-600">🔴 Immediate focus:</span> {projects
                    .filter(p => p.projectStatuses?.[0]?.ragStatus === "Red")
                    .map(p => p.projectName)
                    .join(", ")}
                  <div className="mt-1 ml-6 text-gray-600">
                    {latestAssessment?.keyRisks?.split('\n')[0] || "Critical issues requiring immediate attention."}
                  </div>
                </div>
              )}
              
              {metrics.amber > 0 && (
                <div className="bg-amber-50/50 p-3 rounded-lg">
                  <span className="font-semibold text-amber-600">🟠 Amber risk:</span> {projects
                    .filter(p => p.projectStatuses?.[0]?.ragStatus === "Amber")
                    .map(p => p.projectName)
                    .join(", ")}
                  <div className="mt-1 ml-6 text-gray-600">Requires monitoring and potential intervention.</div>
                </div>
              )}
              
              {metrics.green > 0 && (
                <div className="bg-green-50/50 p-3 rounded-lg">
                  <span className="font-semibold text-green-600">✅ Stable projects:</span> {Math.round((metrics.green / total) * 100)}% of portfolio on track.
                </div>
              )}
              
              <div className="bg-purple-50/50 p-3 rounded-lg">
                <span className="font-semibold text-purple-700">⚡ Top recommendation:</span> {primaryRecommendation}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-4 relative">
              <button
                onClick={() => handleStatusClick("green")}
                className={`flex items-center px-4 py-2 rounded-lg border shadow-sm transition font-bold focus:outline-none focus:ring-2 ${
                  selectedStatus === "green" 
                    ? "ring-green-400 bg-green-200" 
                    : "bg-green-100 hover:bg-green-200 border-green-300 text-green-800"
                }`}
              >
                <span className="mr-2 text-lg">🟢</span> {metrics.green} Green
              </button>
              <button
                onClick={() => handleStatusClick("amber")}
                className={`flex items-center px-4 py-2 rounded-lg border shadow-sm transition font-bold focus:outline-none focus:ring-2 ${
                  selectedStatus === "amber" 
                    ? "ring-yellow-400 bg-yellow-200" 
                    : "bg-yellow-100 hover:bg-yellow-200 border-yellow-300 text-yellow-800"
                }`}
              >
                <span className="mr-2 text-lg">🟡</span> {metrics.amber} Amber
              </button>
              <button
                onClick={() => handleStatusClick("red")}
                className={`flex items-center px-4 py-2 rounded-lg border shadow-sm transition font-bold focus:outline-none focus:ring-2 ${
                  selectedStatus === "red" 
                    ? "ring-red-400 bg-red-200" 
                    : "bg-red-100 hover:bg-red-200 border-red-300 text-red-800"
                }`}
              >
                <span className="mr-2 text-lg">🔴</span> {metrics.red} Red
              </button>

              {selectedStatus && (
                <div
                  ref={dropdownRef}
                  className="absolute left-0 mt-2 z-20 w-full max-w-md bg-white rounded-lg shadow-lg border border-gray-200"
                  style={{ top: "100%" }}
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b">
                    <span className="font-semibold capitalize text-gray-800">
                      {selectedStatus} Projects ({filteredProjects.length})
                    </span>
                    <button 
                      onClick={() => setSelectedStatus(null)} 
                      className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                  <ul className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                    {filteredProjects.length > 0 ? (
                      filteredProjects.map(project => (
                        <li
                          key={project.projectId}
                          className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition ${
                            selectedStatus === "green" ? "bg-green-50" :
                            selectedStatus === "amber" ? "bg-yellow-50" : "bg-red-50"
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium text-gray-700">{project.projectName}</p>
                          </div>
                          <button
                            onClick={() => {
                              if (!project.projectId) {
                                console.error("Missing projectId for:", project.projectName);
                                return;
                              }
                              setLocation(`/projects/${project.projectId}`);
                            }}
                            className={`ml-4 px-3 py-1.5 rounded-lg text-xs font-semibold transition text-white flex items-center ${
                              selectedStatus === "green" ? "bg-green-600 hover:bg-green-700" :
                              selectedStatus === "amber" ? "bg-yellow-500 hover:bg-yellow-600" :
                              "bg-red-600 hover:bg-red-700"
                            }`}
                          >
                            View
                            <ChevronRight className="h-3 w-3 ml-1" />
                          </button>
                        </li>
                      ))
                    ) : (
                      <li className="px-4 py-4 text-center text-gray-400 text-sm">
                        No projects in this status category
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
              <p className="text-xs text-indigo-600 font-medium">
                Continuously learning from your project patterns
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}