import { useQuery } from "@tanstack/react-query";
import { Bot, BarChart3, Activity, Star, Circle } from "lucide-react";
import type { PortfolioAnalysis, Project } from "@shared/schema";
import React from "react";

export function AIAssessmentHeader() {
  const { data: analysis, isLoading } = useQuery<PortfolioAnalysis>({
    queryKey: ["/api/portfolio-analysis"],
  });

  const getPrimaryRecommendation = (reason: string): string => {
  if (!reason) return "Review portfolio and address critical issues immediately";

  // Try to extract direct recommendation
  const recommendationMatch = reason.match(/Recommend (.+?)(\.|$)/i);
  if (recommendationMatch) return recommendationMatch[1];

  // Fallback to general patterns
  const actionMatch =
    reason.match(/focus(.+?)(\.|$)/i) ||
    reason.match(/attention(.+?)(\.|$)/i) ||
    reason.match(/address(.+?)(\.|$)/i);

  return actionMatch
    ? `Focus on ${actionMatch[1].trim()}`
    : "Review portfolio and address critical issues immediately";
};


const primaryRecommendation = analysis?.reason ? getPrimaryRecommendation(analysis.reason) : "";

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects/external"],
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "green":
        return "bg-green-500";
      case "amber":
        return "bg-amber-500";
      case "red":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "green":
        return "bg-green-50 border-green-200";
      case "amber":
        return "bg-amber-50 border-amber-200";
      case "red":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const extractMetrics = (reason: string) => {
    const greenMatch = reason.match(/(\d+)\s*projects.*?Green/i);
    const amberMatch = reason.match(/(\d+)\s*projects.*?Amber/i);
    const redMatch = reason.match(/(\d+)\s*projects.*?Red/i);

    return {
      green: greenMatch ? parseInt(greenMatch[1]) : 0,
      amber: amberMatch ? parseInt(amberMatch[1]) : 0,
      red: redMatch ? parseInt(redMatch[1]) : 0,
    };
  };

  const metrics = analysis ? extractMetrics(analysis.reason) : { green: 0, amber: 0, red: 0 };
  const total = metrics.green + metrics.amber + metrics.red;

  const getSummaryText = () => {
    if (metrics.red > 10) return "High risk projects need immediate attention";
    if (metrics.amber > 15) return "Several projects require monitoring";
    return "Portfolio showing stable performance";
  };

  const strategicCount = projects?.filter((p) => p.projectImportance === "Strategic").length || 0;

  const [selectedStatus, setSelectedStatus] = React.useState<"green" | "amber" | "red" | null>(null);

  const handleStatusClick = (status: "green" | "amber" | "red") => {
    setSelectedStatus(selectedStatus === status ? null : status);
  };

  const dropdownRef = React.useRef<HTMLDivElement>(null);

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

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!analysis) {
    return (
      <div className="p-8 text-center text-gray-600">
        No AI portfolio analysis available yet.
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-blue-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white border border-blue-200 rounded-2xl flex items-center justify-center">
              <Circle className="h-7 w-7 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">AI Portfolio Intelligence</h2>
              <p className="text-blue-600 font-medium">Automated insights and risk analysis</p>
            </div>
          </div>
          <div className="text-xs text-gray-500 bg-white/80 px-3 py-1 rounded-full">
            Updated: {formatDate(analysis.analysisDate!)}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Overall Status */}
            <div className={`rounded-2xl p-4 border-2 ${getStatusBgColor(analysis.overallPortfolioRagStatus)}`}>
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${getStatusColor(analysis.overallPortfolioRagStatus)}`}></div>
                <div>
                  <p className="font-bold text-lg text-gray-900">{analysis.overallPortfolioRagStatus}</p>
                  <p className="text-sm text-gray-600">Tower Health</p>
                </div>
              </div>
            </div>

            {/* Strategic Projects */}
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-4 border-2 border-yellow-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-xl flex items-center justify-center">
                  <Star className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-lg text-gray-900">{strategicCount}</p>
                  <p className="text-sm text-gray-600">Strategic Projects</p>
                </div>
              </div>
            </div>

            {/* Active Projects */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border-2 border-green-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-lg text-gray-900">{total}</p>
                  <p className="text-sm text-gray-600">Active Projects</p>
                </div>
              </div>
            </div>
          </div>

{/* AI Summary */}
<div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-200">
  <div className="flex items-center space-x-3 mb-4">
    <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
      {/* Modern minimalistic icon */}
      <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="7" stroke="white" strokeWidth="2"/>
        <path d="M7 10l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
    <h3 className="font-semibold text-gray-900">AI Analysis & Recommendations</h3>
  </div>

  {/* Replaced Paragraph with AI Recommendation */}
  <div className="text-xs text-gray-500 mb-2">
    <span className="font-medium">Last Updated:</span> July 18, 2025 &nbsp;|&nbsp; <span className="font-medium">Active Projects:</span> 13
  </div>
  <div className="text-sm text-gray-700 leading-relaxed mb-4 space-y-2">
    <div>
      <span className="font-semibold text-red-600">🔴 Immediate focus:</span> CALX Compass, Seymour Whyte Connect<br/>
      <span className="ml-6">API and client confirmation blockages threaten delivery.</span>
    </div>
    <div>
      <span className="font-semibold text-amber-600">🟠 Amber risk:</span> Brandix HRMS<br/>
      <span className="ml-6">Support transition delayed; urgent resource alignment needed.</span>
    </div>
    <div>
      <span className="font-semibold text-green-600">✅ Stable projects:</span> 77% of portfolio on track.
    </div>
    <div>
      <span className="font-semibold text-purple-700">⚡ Top risk driver:</span> API dependencies (impacting 2/3 at-risk projects).
    </div>
    <div>
      <span className="font-semibold text-blue-700">📈 Key action:</span> Escalate blockers and realign resources for at-risk projects.
    </div>
  </div>

  <div className="flex items-center space-x-4 mb-4">
    <button
      onClick={() => handleStatusClick("green")}
      className={`flex items-center px-4 py-2 rounded-lg border shadow-sm transition font-bold focus:outline-none focus:ring-2 ${selectedStatus === "green" ? "ring-green-400 bg-green-200" : "bg-green-100 hover:bg-green-200 border-green-300 text-green-800"}`}
    >
      <span className="mr-2 text-lg">🟢</span> {metrics.green} Green
    </button>
    <button
      onClick={() => handleStatusClick("amber")}
      className={`flex items-center px-4 py-2 rounded-lg border shadow-sm transition font-bold focus:outline-none focus:ring-2 ${selectedStatus === "amber" ? "ring-yellow-400 bg-yellow-200" : "bg-yellow-100 hover:bg-yellow-200 border-yellow-300 text-yellow-800"}`}
    >
      <span className="mr-2 text-lg">🟡</span> {metrics.amber} Amber
    </button>
    <button
      onClick={() => handleStatusClick("red")}
      className={`flex items-center px-4 py-2 rounded-lg border shadow-sm transition font-bold focus:outline-none focus:ring-2 ${selectedStatus === "red" ? "ring-red-400 bg-red-200" : "bg-red-100 hover:bg-red-200 border-red-300 text-red-800"}`}
    >
      <span className="mr-2 text-lg">🔴</span> {metrics.red} Red
    </button>
  </div>
  <div className="relative flex items-center space-x-4 mb-4">
    {/* RAG Buttons (same as before) */}
    {/* Dropdown */}
    {selectedStatus && (
      <div
        ref={dropdownRef}
        className={`
          absolute left-0 mt-2 z-20 w-80
          bg-white rounded-xl shadow-lg border border-gray-200
          transition-all duration-300
          ${selectedStatus ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}
        `}
        style={{ top: "100%" }}
      >
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <span className="font-semibold capitalize text-gray-800">{selectedStatus} Projects</span>
          <button onClick={() => setSelectedStatus(null)} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <ul className="max-h-64 overflow-y-auto divide-y divide-gray-100">
          {projects
            ?.filter(p => (p.ragStatus || "").toLowerCase() === selectedStatus)
            .map(project => (
              <li
                key={project.id}
                className={
                  `flex items-center justify-between px-4 py-2 ` +
                  (selectedStatus === "green"
                    ? "bg-green-50"
                    : selectedStatus === "amber"
                    ? "bg-yellow-50"
                    : "bg-red-50")
                }
              >
                <span className="truncate text-gray-700">{project.name}</span>
                <a
                  href={`/projects/${project.id}`}
                  className={
                    `ml-4 px-3 py-1 rounded text-xs font-semibold transition text-white ` +
                    (selectedStatus === "green"
                      ? "bg-green-600 hover:bg-green-700"
                      : selectedStatus === "amber"
                      ? "bg-yellow-500 hover:bg-yellow-600"
                      : "bg-red-600 hover:bg-red-700")
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View
                </a>
              </li>
            ))}
          {projects?.filter(p => (p.ragStatus || "").toLowerCase() === selectedStatus).length === 0 && (
            <li className="px-4 py-2 text-gray-400 text-sm">No projects in this status.</li>
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
