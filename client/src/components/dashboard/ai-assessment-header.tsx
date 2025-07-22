import { useQuery } from "@tanstack/react-query";
import { Bot, Activity, Star, ChevronRight, AlertCircle, RefreshCw, ChevronDown, ChevronLeft } from "lucide-react";
import React from "react";
import { useLocation } from "wouter";

const PAGINATION_STEPS = [
  { key: "assessment", label: "Organization Assessment" },
  { key: "risks", label: "Key Risks" },
  { key: "recommendations", label: "Recommendations" }
];

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
      green?: number;
      amber?: number;
      red?: number;
      error?: number;
    };
    importanceGroups: {
      high?: Record<string, number>;
      medium?: Record<string, number>;
      strategic?: Record<string, number>;
      [key: string]: Record<string, number> | undefined;
    };
  };
  llmOrgRagStatus: string;
  llmOrgAssessmentDescription: string;
  keyRisks: string;
  recommendedActions: string;
  escalationNeeded: boolean;
  escalationsCount: number;
  overallHealthScore: number | null;
  createdAt: string;
  updatedAt: string;
  trends: {
    assessmentDate: string;
    green: number;
    amber: number;
    red: number;
    total: number;
  }[];
  projectDetails: ProjectDetail[];
}

interface ProjectDetail {
  projectId: number;
  projectName: string;
  account: string;
  billingModel: string;
  tower: string;
  currentStatus: string;
  aiAssessment: string | null;
  keyIssues: string | null;
  planForGreen: string | null;
  currentSdlcPhase: string | null;
  escalationNeeded: boolean;
}

interface PortfolioAnalysis {
  overallPortfolioRagStatus: string;
  reason: string;
  analysisDate: string;
  metrics: {
    green: number;
    amber: number;
    red: number;
    error?: number;
  };
}

interface StrategicProjectsData {
  total: number;
  statusCounts: Record<string, number>;
  displayText: string;
}

type StatusType = "green" | "amber" | "red" | "error";

interface Manager {
  name: string;
  value: string;
}

const DELIVERY_MANAGERS: Manager[] = [
  { name: "Raja", value: "Raja" },
  { name: "Ani", value: "Ani" }
];

// Add all people and their levels
const PEOPLE = [
  { name: "Raja", value: "Raja", level: "DELIVERY_MANAGER" },
  { name: "Ani", value: "Ani", level: "DELIVERY_MANAGER" },
  { name: "Vijo Jacob", value: "Vijo Jacob", level: "PROJECT_MANAGER" },
  { name: "Yamuna Rani M", value: "Yamuna Rani M", level: "PROJECT_MANAGER" },
  { name: "Ashwathy Nair", value: "Ashwathy Nair", level: "PROJECT_MANAGER" },
  { name: "Shanavaz A", value: "Shanavaz A", level: "PROJECT_MANAGER" },
  { name: "ORG Head", value: "ORG Head", level: "ORG_HEAD" }
];

interface AIAssessmentHeaderProps {
  selectedPerson?: { name: string; value: string; level: string };
  onPersonChange?: (person: { name: string; value: string; level: string }) => void;
}

export function AIAssessmentHeader({
  selectedPerson: propSelectedPerson,
  onPersonChange
}: AIAssessmentHeaderProps) {
  // Use the first person as default
  const [internalSelectedPerson, setInternalSelectedPerson] = React.useState(PEOPLE[0]);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();
  const [selectedStatus, setSelectedStatus] = React.useState<StatusType | null>(null);
  const statusDropdownRef = React.useRef<HTMLDivElement>(null);

  // Add pagination state
  const [aiPage, setAiPage] = React.useState(0);

  const selectedPerson = propSelectedPerson || internalSelectedPerson;

  // Use selectedPerson.value and selectedPerson.level in API
  const { data: assessments, isLoading, error, refetch } = useQuery<Assessment[]>({
    queryKey: ["assessments", selectedPerson.value, selectedPerson.level],
    queryFn: async () => {
      const response = await fetch(
        `http://34.63.198.88/api/organizational-assessments/dashboard?assessedPersonName=${selectedPerson.value}&assessmentLevel=${selectedPerson.level}`
      );
      
      if (!response.ok) {
        const text = await response.text();
        if (text.startsWith("<!DOCTYPE")) {
          throw new Error("Server returned HTML error page");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        throw new Error("Invalid content type, expected JSON");
      }

      return await response.json();
    },
    retry: 2
  });

  const currentAssessment = React.useMemo(() => {
    if (!assessments || assessments.length === 0) return null;
    return assessments.find(a => a.assessedPersonName === selectedPerson.value) || assessments[0];
  }, [assessments, selectedPerson]);

  const analysis = React.useMemo<PortfolioAnalysis | null>(() => {
    if (!currentAssessment) return null;

    return {
      overallPortfolioRagStatus: currentAssessment.llmOrgRagStatus || "red",
      reason: currentAssessment.llmOrgAssessmentDescription || "No assessment available",
      analysisDate: currentAssessment.updatedAt || currentAssessment.assessmentDate,
      metrics: {
        green: currentAssessment.projectsSummary?.statusCounts?.green || 0,
        amber: currentAssessment.projectsSummary?.statusCounts?.amber || 0,
        red: currentAssessment.projectsSummary?.statusCounts?.red || 0,
        error: currentAssessment.projectsSummary?.statusCounts?.error || 0
      }
    };
  }, [currentAssessment]);

  const strategicProjectsData = React.useMemo<StrategicProjectsData>(() => {
    if (!currentAssessment?.projectsSummary?.importanceGroups) {
      return {
        total: 0,
        statusCounts: {},
        displayText: "0 Strategic Projects"
      };
    }

    const strategicGroup = 
      currentAssessment.projectsSummary.importanceGroups.strategic ||
      currentAssessment.projectsSummary.importanceGroups["strategic "];

    if (!strategicGroup) {
      return {
        total: 0,
        statusCounts: {},
        displayText: "0 Strategic Projects"
      };
    }

    const filteredStatusCounts = Object.entries(strategicGroup).reduce((acc, [status, count]) => {
      if (status.toLowerCase() !== "error") {
        acc[status] = count;
      }
      return acc;
    }, {} as Record<string, number>);

    const total = Object.values(filteredStatusCounts).reduce((sum, count) => sum + count, 0);
    
    return {
      total,
      statusCounts: filteredStatusCounts,
      displayText: `${total} Strategic Projects` +
        (total > 0 ? ` (${Object.entries(filteredStatusCounts)
          .map(([status, count]) => `${status}: ${count}`)
          .join(", ")})` : "")
    };
  }, [currentAssessment]);

  const filteredProjects = React.useMemo(() => {
    if (!selectedStatus || !currentAssessment?.projectDetails) return [];
    
    return currentAssessment.projectDetails
      .filter(p => p.currentStatus?.toLowerCase() === selectedStatus)
      .map(project => ({
        ...project,
        projectStatuses: [{
          ragStatus: project.currentStatus,
          reportingDate: currentAssessment.assessmentDate
        }]
      }));
  }, [selectedStatus, currentAssessment]);

  const getStatusColor = (status?: string): string => {
    switch (status?.toLowerCase()) {
      case "green": return "bg-green-500";
      case "amber": return "bg-amber-500";
      case "red": return "bg-red-500";
      case "error": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusBgColor = (status?: string): string => {
    switch (status?.toLowerCase()) {
      case "green": return "bg-green-50 border-green-200";
      case "amber": return "bg-amber-50 border-amber-200";
      case "red": return "bg-red-50 border-red-200";
      case "error": return "bg-gray-50 border-gray-200";
      default: return "bg-gray-50 border-gray-200";
    }
  };

  const getHealthScoreDisplay = (score: number | null): { 
    value: string; 
    color: { bg: string; border: string; text: string }; 
    gradient: string;
    showScore: boolean;
  } => {
    if (score === null) {
    return {
      value: "N/A",
      color: { bg: "from-gray-50 to-gray-100", border: "border-gray-200", text: "text-gray-500" },
      gradient: "from-gray-400 to-gray-500",
      showScore: false
    };
  }
    
    if (score > 5) return { 
      value: score.toString(),
      color: { bg: "from-green-50 to-emerald-50", border: "border-green-200", text: "text-green-600" },
      gradient: "from-green-500 to-emerald-500",
      showScore: true
    };
    if (score === 5) return { 
      value: score.toString(),
      color: { bg: "from-amber-50 to-yellow-50", border: "border-amber-200", text: "text-amber-600" },
      gradient: "from-amber-500 to-yellow-500",
      showScore: true
    };
    return { 
      value: score.toString(),
      color: { bg: "from-red-50 to-rose-50", border: "border-red-200", text: "text-red-600" },
      gradient: "from-red-500 to-rose-500",
      showScore: true
    };
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "Invalid date";
    }
  };

  const handleStatusClick = (status: StatusType) => {
    setSelectedStatus(selectedStatus === status ? null : status);
  };

  const [isGenerating, setIsGenerating] = React.useState(false);

  const handleGenerateAssessment = async () => {
    if (!selectedPerson) {
      alert("Please select a person first");
      return;
    }
    
    setIsGenerating(true);
    try {
      const response = await fetch("http://34.63.198.88:8080/api/organizational-assessments/generate", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assessmentLevel: selectedPerson.level,
          assessedPersonName: selectedPerson.value,
          llmProvider: "gemini",
          reAssess: true
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Show success message
      alert("Assessment generated successfully!");
      
      // Refetch the data after a short delay to get the latest assessment
      setTimeout(() => {
        refetch();
      }, 2000);
      
      return result;
    } catch (error) {
      console.error("Error generating assessment:", error);
      alert(`Failed to generate assessment: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePersonSelect = (person: typeof PEOPLE[0]) => {
    if (onPersonChange) {
      onPersonChange(person);
    } else {
      setInternalSelectedPerson(person);
    }
    setIsDropdownOpen(false);
  };

  // Helper to clean up bullet points and unwanted symbols
  const cleanText = (text?: string): string[] => {
    if (!text) return [];
    return text
      .split('\n')
      .map(line => line.replace(/^[-*•\d\s]+/, '').trim())
      .filter(line => line.length > 0);
  };

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setSelectedStatus(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Reset pagination when selectedPerson changes
  React.useEffect(() => {
    setAiPage(0);
  }, [selectedPerson]);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-600 bg-gray-50 rounded-xl">
        <div className="inline-flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading portfolio analysis...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-red-50 rounded-xl">
        <div className="flex flex-col items-center justify-center text-red-600">
          <AlertCircle className="w-10 h-10 mb-2" />
          <h3 className="font-bold text-lg">Error Loading Assessment</h3>
          <p className="text-sm mt-2 max-w-md">
            {(error as Error).message.includes("HTML") ? (
              <>
                The server returned an HTML error page instead of JSON data.<br />
                Please check that the API endpoint is correctly configured.
              </>
            ) : (
              (error as Error).message
            )}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg text-red-700 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!currentAssessment) {
    return (
      <div className="p-8 text-center text-gray-600 bg-gray-50 rounded-xl">
        <AlertCircle className="w-10 h-10 mx-auto mb-2 text-gray-400" />
        <p>No assessment data available</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium"
        >
          Refresh
        </button>
      </div>
    );
  }

  const metrics = analysis?.metrics || { green: 0, amber: 0, red: 0, error: 0 };
  const totalProjects = currentAssessment.projectsSummary?.total || 0;
  const healthScoreDisplay = getHealthScoreDisplay(currentAssessment.overallHealthScore);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-blue-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between mb-4">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg shadow-sm transition font-medium border border-gray-300"
            >
              {selectedPerson.name} <span className="ml-2 text-xs text-gray-500">({selectedPerson.level.replace("_", " ")})</span>
              <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${isDropdownOpen ? 'transform rotate-180' : ''}`} />
            </button>
            {isDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200">
                <ul className="py-1">
                  {PEOPLE.map((person) => (
                    <li key={person.value + person.level}>
                      <button
                        onClick={() => handlePersonSelect(person)}
                        className={`w-full text-left px-4 py-2 hover:bg-blue-50 ${
                          selectedPerson.value === person.value && selectedPerson.level === person.level
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-700'
                        }`}
                      >
                        {person.name} <span className="ml-2 text-xs text-gray-500">({person.level.replace("_", " ")})</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <button
            onClick={handleGenerateAssessment}
            disabled={isGenerating}
            className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition font-medium"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate New Assessment
              </>
            )}
          </button>
        </div>

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
          {analysis && (
            <div className="text-xs text-gray-500 bg-white/80 px-3 py-1.5 rounded-full border border-blue-100 shadow-sm">
              Last updated: {formatDate(analysis.analysisDate)}
            </div>
          )}
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-blue-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className={`rounded-lg p-4 border-2 ${getStatusBgColor(analysis?.overallPortfolioRagStatus)} relative`}>
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${getStatusColor(analysis?.overallPortfolioRagStatus)}`}></div>
                <div>
                  <p className="font-bold text-lg text-gray-900 capitalize">
                    {analysis?.overallPortfolioRagStatus || "unknown"}
                  </p>
                  <p className="text-sm text-gray-600">Status</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg p-4 border-2 border-yellow-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-lg flex items-center justify-center shadow-sm">
                  <Star className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-lg text-gray-900">{strategicProjectsData.total}</p>
                  <p className="text-sm text-gray-600">Strategic Projects</p>
                  {strategicProjectsData.total > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      {Object.entries(strategicProjectsData.statusCounts).map(([status, count]) => (
                        <span key={status} className="mr-2">
                          {status}: {count}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={`bg-gradient-to-br ${healthScoreDisplay.color.bg} rounded-lg p-4 border-2 ${healthScoreDisplay.color.border}`}>
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 bg-gradient-to-r ${healthScoreDisplay.gradient} rounded-lg flex items-center justify-center shadow-sm`}>
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className={`font-bold text-lg ${healthScoreDisplay.color.text}`}>
                    {healthScoreDisplay.value}
                  </p>
                  <p className="text-sm text-gray-600">Overall Health Score</p>
                  {!healthScoreDisplay.showScore && (
                    <p className="text-xs text-gray-500 mt-1">Score not calculated</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* AI Analysis & Recommendations Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-blue-200 shadow-sm mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                AI Analysis & Recommendations
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAiPage(p => Math.max(0, p - 1))}
                  disabled={aiPage === 0}
                  className={`p-2 rounded-full border ${aiPage === 0 ? 'bg-gray-100 text-gray-400' : 'bg-white hover:bg-blue-50 text-blue-600'}`}
                  aria-label="Previous"
                >
                  <ChevronLeft />
                </button>
                <span className="text-sm font-medium">{PAGINATION_STEPS[aiPage].label}</span>
                <button
                  onClick={() => setAiPage(p => Math.min(PAGINATION_STEPS.length - 1, p + 1))}
                  disabled={aiPage === PAGINATION_STEPS.length - 1}
                  className={`p-2 rounded-full border ${aiPage === PAGINATION_STEPS.length - 1 ? 'bg-gray-100 text-gray-400' : 'bg-white hover:bg-blue-50 text-blue-600'}`}
                  aria-label="Next"
                >
                  <ChevronRight />
                </button>
              </div>
            </div>
            <div>
              {aiPage === 0 && (
                <div className="bg-blue-50/70 p-4 rounded-lg border border-blue-200 shadow-sm">
                  <span className="font-semibold text-blue-700 text-lg flex items-center gap-2">
                    📊 Organization Assessment
                    <span className="ml-2 px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-bold">Step 1</span>
                  </span>
                  {cleanText(currentAssessment?.llmOrgAssessmentDescription).length > 0 ? (
                    <ul className="mt-3 ml-6 text-gray-700 list-disc space-y-2 text-base">
                      {cleanText(currentAssessment?.llmOrgAssessmentDescription).map((line, i) => (
                        <li key={i} className="font-medium">
                          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2 align-middle"></span>
                          <span className="align-middle">{line}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-gray-500 mt-3 ml-6">No assessment available.</div>
                  )}
                </div>
              )}
              {aiPage === 1 && (
                <div className="bg-red-50/70 p-4 rounded-lg border border-red-200 shadow-sm">
                  <span className="font-semibold text-red-700 text-lg flex items-center gap-2">
                    ⚠️ Key Risks
                    <span className="ml-2 px-2 py-0.5 rounded bg-red-100 text-red-800 text-xs font-bold">Step 2</span>
                  </span>
                  {cleanText(currentAssessment?.keyRisks).length > 0 ? (
                    <ul className="mt-3 ml-6 text-gray-700 list-disc space-y-2 text-base">
                      {cleanText(currentAssessment?.keyRisks).map((risk, i) => (
                        <li key={i} className="font-medium">
                          <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2 align-middle"></span>
                          <span className="align-middle">{risk}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-gray-500 mt-3 ml-6">No key risks available.</div>
                  )}
                </div>
              )}
              {aiPage === 2 && (
                <div className="bg-green-50/70 p-4 rounded-lg border border-green-200 shadow-sm">
                  <span className="font-semibold text-green-700 text-lg flex items-center gap-2">
                    💡 Recommendations
                    <span className="ml-2 px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs font-bold">Step 3</span>
                  </span>
                  {cleanText(currentAssessment?.recommendedActions).length > 0 ? (
                    <ul className="mt-3 ml-6 text-gray-700 list-disc space-y-2 text-base">
                      {cleanText(currentAssessment?.recommendedActions).map((action, i) => (
                        <li key={i} className="font-medium">
                          <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 align-middle"></span>
                          <span className="align-middle">{action}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-gray-500 mt-3 ml-6">No recommendations available.</div>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-center mt-6 gap-2">
              {PAGINATION_STEPS.map((step, idx) => (
                <button
                  key={step.key}
                  onClick={() => setAiPage(idx)}
                  className={`w-3 h-3 rounded-full border-2 transition ${aiPage === idx ? 'bg-blue-600 border-blue-600' : 'bg-gray-200 border-gray-300'}`}
                  aria-label={`Go to step ${idx + 1}`}
                />
              ))}
            </div>
          </div>
          <br></br>

          <div className="flex flex-wrap items-center gap-3 mb-4 relative" ref={statusDropdownRef}>
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
                    filteredProjects.map((project) => (
                      <li
                        key={project.projectId}
                        className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition ${
                          selectedStatus === "green" ? "bg-green-50" :
                          selectedStatus === "amber" ? "bg-yellow-50" : 
                          selectedStatus === "red" ? "bg-red-50" : "bg-gray-50"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-gray-700">{project.projectName}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {project.account} • {project.tower}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            if (!project.projectId) {
                              console.error("Missing projectId for:", project.projectName);
                              return;
                            }
                            setLocation(`/projects/${project.projectId}`, {
                              state: { from: 'dashboard' }
                            });
                          }}
                          className={`ml-4 px-3 py-1.5 rounded-lg text-xs font-semibold transition text-white flex items-center ${
                            selectedStatus === "green" 
                              ? "bg-green-600 hover:bg-green-700" 
                              : selectedStatus === "amber" 
                                ? "bg-yellow-500 hover:bg-yellow-600" 
                                : "bg-red-600 hover:bg-red-700"
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
  );
}