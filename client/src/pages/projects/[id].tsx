import React from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Info, ClipboardList, AlertTriangle, CheckCircle, RefreshCw, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface LocationState {
  from?: 'dashboard' | 'projects';
  previousPath?: string;
}

// Type definitions based on your actual API response
interface ExternalProject {
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
  projectStatuses: ProjectStatus[];
  projectReviews: ProjectReview[];
}

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

interface ProjectReview {
  reviewId: string;
  project: string;
  reviewDate: string;
  reviewType: string;
  reviewCycleNumber: number;
  executiveSummary: string;
  architectureDesignReview: string;
  codeQualityStandards: string;
  devOpsDeploymentReadiness: string;
  testingQA: string;
  riskIdentification: string;
  complianceStandards: string;
  actionItemsRecommendations: string;
  reviewerSignOff: string;
  sqaValidation: string;
}

const parseTextToPoints = (text: string): string[] => {
  if (!text || text.trim() === '') return [];
  const initialSplit = text.split(/\n|•|·|\d+\.|-/);
  const sentences = initialSplit.flatMap(item => {
    const trimmed = item.trim();
    if (!trimmed) return [];
    return trimmed.split(/\.\s+|\.$/).map(s => {
      const clean = s.trim();
      return clean ? clean + (s.endsWith('.') ? '.' : '') : '';
    }).filter(Boolean);
  });
  return sentences;
};

const collectAllStatusValues = (
  statuses: ProjectStatus[] | undefined, 
  fieldName: keyof ProjectStatus
): string[] => {
  if (!statuses || statuses.length === 0) return [];
  const allValues: string[] = [];
  statuses.forEach(status => {
    const value = status[fieldName];
    if (value && typeof value === 'string' && value.trim() !== '') {
      allValues.push(...parseTextToPoints(value));
    }
  });
  return Array.from(new Set(allValues));
};

const parseActionItemsToTasks = (actionItems: string): Array<{task: string, priority: string, owner: string, status: string}> => {
  if (!actionItems || actionItems.trim() === '') return [];
  const items = parseTextToPoints(actionItems);
  return items.map((item, index) => ({
    task: item,
    priority: index < 2 ? "🔴 High" : index < 4 ? "🟡 Medium" : "🟢 Low",
    owner: "Project Team",
    status: "Pending"
  }));
};

export default function ProjectDetailsPage() {
  const [location, navigate] = useLocation();
  
  // Get the project ID from the URL
  const pathSegments = window.location.pathname.split("/");
  const id = pathSegments[pathSegments.length - 1];

  // Get navigation state from browser history
  const getNavigationState = (): LocationState => {
    try {
      // Check if we have state from navigation
      const historyState = window.history.state;
      if (historyState && typeof historyState === 'object') {
        return historyState as LocationState;
      }
    } catch (error) {
      console.warn('Could not access history state:', error);
    }
    return {};
  };

  const navigationState = getNavigationState();

  // Determine back path with multiple fallback strategies
  const getBackPath = (): { path: string; label: string } => {
    // Strategy 1: Check navigation state
    if (navigationState?.from === 'dashboard') {
      return { path: '/', label: 'Dashboard' };
    }
    if (navigationState?.from === 'projects') {
      return { path: '/projects', label: 'Projects' };
    }
    if (navigationState?.previousPath) {
      const label = navigationState.previousPath === '/' ? 'Dashboard' : 'Projects';
      return { path: navigationState.previousPath, label };
    }

    // Strategy 2: Check document referrer
    if (document.referrer) {
      try {
        const referrerUrl = new URL(document.referrer);
        const referrerPath = referrerUrl.pathname;
        
        if (referrerPath === '/' || referrerPath === '/dashboard') {
          return { path: '/', label: 'Dashboard' };
        }
        if (referrerPath === '/projects' || referrerPath.startsWith('/projects')) {
          return { path: '/projects', label: 'Projects' };
        }
      } catch (error) {
        console.warn('Could not parse referrer URL:', error);
      }
    }

    // Strategy 3: Check browser history length and URL patterns
    if (window.history.length > 1) {
      // If we have history, try to go back
      if (location.includes('/projects/')) {
        // We're likely in a project detail page, so projects list is a safe bet
        return { path: '/projects', label: 'Projects' };
      }
    }

    // Strategy 4: Default fallback based on URL structure
    if (location.includes('/projects/')) {
      return { path: '/projects', label: 'Projects' };
    }

    // Final fallback to dashboard
    return { path: '/', label: 'Dashboard' };
  };

  const { path: backPath, label: backLabel } = getBackPath();

  // Enhanced back navigation handler
  const handleBackNavigation = (e: React.MouseEvent) => {
    e.preventDefault();
    
    try {
      // If we have a reliable history state, use browser back
      if (navigationState?.from && window.history.length > 1) {
        window.history.back();
        return;
      }
      
      // Otherwise, navigate to the determined path
      navigate(backPath);
    } catch (error) {
      console.warn('Navigation error:', error);
      // Fallback to direct navigation
      navigate(backPath);
    }
  };

  const { data: projects, isLoading: projectsLoading } = useQuery<ExternalProject[]>({
    queryKey: ["/api/projects/external/"],
  });

  const project = projects?.find(p => 
    p.projectId.toString() === id || 
    (p.projectCodeId && p.projectCodeId === id) ||
    p.projectId === parseInt(id)
  );

  const latestStatus = project?.projectStatuses && project.projectStatuses.length > 0 
    ? project.projectStatuses.sort((a, b) => new Date(b.reportingDate).getTime() - new Date(a.reportingDate).getTime())[0]
    : null;
  
  const latestReview = project?.projectReviews && project.projectReviews.length > 0 
    ? project.projectReviews.sort((a, b) => new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime())[0]
    : null;

  // Enhanced RAG status visualization
  const ragStatus = latestStatus?.ragStatus || 'Unknown';
  const ragConfig = {
    'Green': {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: 'text-green-500',
      headerBg: 'bg-gradient-to-r from-green-50 to-green-100',
      shadow: 'shadow-green-100/50',
      iconComponent: CheckCircle,
    },
    'Amber': {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-800',
      icon: 'text-amber-500',
      headerBg: 'bg-gradient-to-r from-amber-50 to-amber-100',
      shadow: 'shadow-amber-100/50',
      iconComponent: AlertTriangle,
    },
    'Yellow': {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: 'text-yellow-500',
      headerBg: 'bg-gradient-to-r from-yellow-50 to-yellow-100',
      shadow: 'shadow-yellow-100/50',
      iconComponent: AlertTriangle,
    },
    'Red': {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: 'text-red-500',
      headerBg: 'bg-gradient-to-r from-red-50 to-red-100',
      shadow: 'shadow-red-100/50',
      iconComponent: AlertTriangle,
    },
    'Unknown': {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-800',
      icon: 'text-gray-500',
      headerBg: 'bg-gradient-to-r from-gray-50 to-gray-100',
      shadow: 'shadow-gray-100/50',
      iconComponent: Info,
    }
  };

  const {
    bg,
    border,
    text,
    icon,
    headerBg,
    shadow,
    iconComponent: StatusIcon,
  } = ragConfig[ragStatus as keyof typeof ragConfig] || ragConfig['Unknown'];

  // Parse data
  const updateSummary = collectAllStatusValues(project?.projectStatuses, 'keyWeeklyUpdates');
  const issues = collectAllStatusValues(project?.projectStatuses, 'issuesChallenges');
  const mitigation = collectAllStatusValues(project?.projectStatuses, 'planForGreen');
  const nextSteps = collectAllStatusValues(project?.projectStatuses, 'planForNextWeek');
  const tasks = latestReview?.actionItemsRecommendations
    ? parseActionItemsToTasks(latestReview.actionItemsRecommendations)
    : [];

  const aiAssessments = project?.projectStatuses
    ?.filter(s => s.llmAiAssessmentDescription)
    .map(s => ({
      date: s.reportingDate,
      status: s.llmAiStatus,
      description: parseTextToPoints(s.llmAiAssessmentDescription)
    })) || [];

  const sqaRemarks = project?.projectStatuses
    ?.filter(s => s.sqaRemarks)
    .map(s => ({
      date: s.reportingDate,
      remarks: parseTextToPoints(s.sqaRemarks)
    })) || [];

  const clientEscalations = project?.projectStatuses
    ?.filter(s => s.clientEscalation && s.clientEscalationDetails)
    .map(s => ({
      date: s.reportingDate,
      details: s.clientEscalationDetails
    })) || [];

  // Render back button component
  const renderBackButton = () => (
    <button
      onClick={handleBackNavigation}
      className={`flex items-center ${text} hover:opacity-80 font-semibold text-lg transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-lg px-2 py-1`}
      aria-label={`Back to ${backLabel}`}
    >
      <ArrowLeft className={`h-5 w-5 mr-2 ${icon}`} /> 
      Back to {backLabel}
    </button>
  );

  if (projectsLoading) {
    return (
      <div className="min-h-[calc(100vh-0px)] w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-gray-600">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-[calc(100vh-0px)] w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Not Found</h2>
          <p className="text-gray-600 mb-4">The project with ID {id} could not be found.</p>
          {renderBackButton()}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-[calc(100vh-0px)] w-full flex flex-col items-stretch ${bg} animate-fade-in`}>
      {/* Status Header with improved back button */}
      <div className={`sticky top-0 z-20 ${headerBg} py-4 px-2 sm:px-6 md:px-12 lg:px-24 xl:px-32 shadow-sm flex items-center border-b ${border}`}>
        {renderBackButton()}
        
        <div className={`ml-auto px-4 py-2 rounded-full ${bg} border ${border} ${text} font-bold flex items-center`}>
          <StatusIcon className={`h-5 w-5 mr-2 ${icon}`} />
          {ragStatus}
        </div>
      </div>

      <div className={`flex flex-col flex-grow items-center justify-center py-8 px-2 sm:px-6 md:px-12 lg:px-24 xl:px-32 ${bg}`}>
        <div className="w-full flex flex-col gap-8">
          {/* Project Header */}
          <div className={`rounded-2xl shadow-lg ${shadow} border ${border} p-6 ${bg} flex flex-col md:flex-row md:items-center md:justify-between gap-4`}>
            <div>
              <h1 className={`text-2xl font-extrabold ${text} flex items-center gap-3 tracking-tight`}>
                <Info className={`h-7 w-7 ${icon}`} /> 
                {project.projectName}
                <span className={`text-lg font-semibold ${text}`}>Project Health Dashboard</span>
              </h1>
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                {project.projectCodeId && (
                  <span className={`bg-white px-2 py-1 rounded border ${border}`}>Code: {project.projectCodeId}</span>
                )}
                <span className={`bg-white px-2 py-1 rounded border ${border}`}>ID: {project.projectId}</span>
                <span className={`bg-white px-2 py-1 rounded border ${border}`}>PM: {project.projectManagerName}</span>
                <span className={`bg-white px-2 py-1 rounded border ${border}`}>Account: {project.account}</span>
                <span className={`bg-white px-2 py-1 rounded border ${border}`}>Tower: {project.tower}</span>
              </div>
            </div>
            
            <div className={`flex flex-col items-center justify-center p-4 rounded-lg bg-white border-2 ${border}`}>
              <span className="text-xs font-medium text-gray-500 mb-1">CURRENT STATUS</span>
              <div className={`text-2xl font-bold ${text} flex items-center`}>
                <StatusIcon className="h-6 w-6 mr-2" />
                {ragStatus}
              </div>
            </div>
          </div>

          {/* Critical Issues Section - Only shown for Red status */}
          {ragStatus === 'Red' && (
            <div className={`rounded-2xl border-l-4 ${border} ${bg} p-5 shadow-sm`}>
              <h3 className={`font-bold flex items-center ${text} mb-3`}>
                <AlertTriangle className={`h-5 w-5 mr-2 ${icon}`} />
                Critical Issues Requiring Attention
              </h3>
              {issues.slice(0, 3).map((issue, idx) => (
                <div key={idx} className="flex items-start mt-2">
                  <span className={`${icon} mr-2 mt-1`}>•</span>
                  <p className={`text-sm ${text}`}>{issue}</p>
                </div>
              ))}
              {mitigation.length > 0 && (
                <div className="mt-4">
                  <h4 className={`text-sm font-semibold ${text} mb-2`}>Recommended Actions:</h4>
                  {mitigation.slice(0, 2).map((action, idx) => (
                    <div key={`action-${idx}`} className="flex items-start">
                      <span className={`${icon} mr-2 mt-1`}>•</span>
                      <p className={`text-sm ${text}`}>{action}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Main Content Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Update Summary */}
            <section className={`bg-white rounded-2xl shadow-lg border ${border} p-6 flex flex-col hover:shadow-xl transition-shadow`}>
              <div className="flex items-center mb-3">
                <ClipboardList className={`h-5 w-5 ${icon} mr-2`} />
                <h2 className={`text-lg font-bold ${text} tracking-tight`}>Weekly Updates</h2>
              </div>
              {updateSummary.length > 0 ? (
                <div className="space-y-2">
                  {updateSummary.map((item, idx) => (
                    <div key={idx} className="flex items-start">
                      <span className={`${icon} mr-2`}>•</span>
                      <p className="text-gray-700 text-sm">{item}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 italic text-sm">
                  <p>No weekly updates available for this project.</p>
                </div>
              )}
            </section>

            {/* Tasks Identified */}
            <section className={`bg-white rounded-2xl shadow-lg border ${border} p-6 flex flex-col hover:shadow-xl transition-shadow`}>
              <div className="flex items-center mb-3">
                <ClipboardList className={`h-5 w-5 ${icon} mr-2`} />
                <h2 className={`text-lg font-bold ${text} tracking-tight`}>Action Items</h2>
              </div>
              {tasks.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full border text-sm rounded-lg overflow-hidden">
                    <thead className={`${bg}`}>
                      <tr>
                        <th className="px-3 py-2 text-left">Task</th>
                        <th className="px-3 py-2 text-left">Priority</th>
                        <th className="px-3 py-2 text-left">Owner</th>
                        <th className="px-3 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((t, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="px-3 py-2 font-medium text-gray-900">{t.task}</td>
                          <td className="px-3 py-2">{t.priority}</td>
                          <td className="px-3 py-2">{t.owner}</td>
                          <td className="px-3 py-2">{t.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-gray-500 italic text-sm">
                  <p>No action items or tasks available.</p>
                </div>
              )}
            </section>

            {/* Key Issues */}
            <section className={`bg-white rounded-2xl shadow-lg border ${border} p-6 flex flex-col md:col-span-2 hover:shadow-xl transition-shadow`}>
              <div className="flex items-center mb-3">
                <AlertTriangle className={`h-5 w-5 ${icon} mr-2`} />
                <h2 className={`text-lg font-bold ${text} tracking-tight`}>All Issues & Challenges</h2>
                {clientEscalations.length > 0 && (
                  <span className={`ml-2 ${bg} ${text} text-xs px-2 py-1 rounded border ${border}`}>
                    {clientEscalations.length} Client Escalation(s)
                  </span>
                )}
              </div>
              {issues.length > 0 ? (
                <div className="space-y-2">
                  {issues.map((item, idx) => (
                    <div key={idx} className="flex items-start">
                      <span className={`${icon} mr-2`}>•</span>
                      <p className="text-gray-700 text-sm">{item}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 italic text-sm">
                  <p>No issues or challenges reported across all status updates.</p>
                </div>
              )}

              {clientEscalations.map((escalation, idx) => (
                <div key={`escalation-${idx}`} className={`mt-4 p-3 ${bg} border-l-4 ${border}`}>
                  <p className={`text-sm ${text}`}>
                    <strong>Escalation on {new Date(escalation.date).toLocaleDateString()}:</strong> 
                    {" "}{escalation.details}
                  </p>
                </div>
              ))}
            </section>

            {/* Path to Green */}
            <section className={`bg-white rounded-2xl shadow-lg border ${border} p-6 flex flex-col md:col-span-2 hover:shadow-xl transition-shadow`}>
              <div className="flex items-center mb-3">
                <CheckCircle className={`h-5 w-5 ${icon} mr-2`} />
                <h2 className={`text-lg font-bold ${text} tracking-tight`}>Path to Green Plans</h2>
              </div>
              {mitigation.length > 0 ? (
                <div className="space-y-2">
                  {mitigation.map((item, idx) => (
                    <div key={idx} className="flex items-start">
                      <span className={`${icon} mr-2`}>•</span>
                      <p className="text-gray-700 text-sm">{item}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 italic text-sm">
                  <p>No specific path to green plan documented.</p>
                  {ragStatus === 'Green' && (
                    <p className={`mt-1 ${text}`}>✓ Project is already in Green status.</p>
                  )}
                </div>
              )}
            </section>

            {/* Next Steps */}
            <section className={`bg-white rounded-2xl shadow-lg border ${border} p-6 flex flex-col md:col-span-2 hover:shadow-xl transition-shadow`}>
              <div className="flex items-center mb-3">
                <RefreshCw className={`h-5 w-5 ${icon} mr-2`} />
                <h2 className={`text-lg font-bold ${text} tracking-tight`}>Next Steps</h2>
                {latestStatus?.currentSdlcPhase && (
                  <span className={`ml-auto ${bg} ${text} text-xs px-2 py-1 rounded border ${border}`}>
                    Current Phase: {latestStatus.currentSdlcPhase}
                  </span>
                )}
              </div>
              {nextSteps.length > 0 ? (
                <div className="space-y-2">
                  {nextSteps.map((item, idx) => (
                    <div key={idx} className="flex items-start">
                      <span className={`${icon} mr-2`}>•</span>
                      <p className="text-gray-700 text-sm">{item}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 italic text-sm">
                  <p>No next steps defined across all status updates.</p>
                </div>
              )}
            </section>

            {/* AI Assessments */}
            {aiAssessments.length > 0 && (
              <section className={`bg-white rounded-2xl shadow-lg border ${border} p-6 flex flex-col md:col-span-2 hover:shadow-xl transition-shadow`}>
                <div className="flex items-center mb-3">
                  <Info className={`h-5 w-5 ${icon} mr-2`} />
                  <h2 className={`text-lg font-bold ${text} tracking-tight`}>AI Assessments</h2>
                </div>
                
                <div className="space-y-4">
                  {aiAssessments.map((assessment, idx) => (
                    <div key={`ai-${idx}`} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center mb-2">
                        <span className={`text-xs ${text}`}>
                          {new Date(assessment.date).toLocaleDateString()}
                        </span>
                        <span className={`ml-2 ${bg} ${text} text-xs px-2 py-1 rounded border ${border}`}>
                          {assessment.status}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {assessment.description.map((point, pIdx) => (
                          <p key={`ai-point-${idx}-${pIdx}`} className="text-gray-700 text-sm">
                            {point}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* SQA Remarks */}
            {sqaRemarks.length > 0 && (
              <section className={`bg-white rounded-2xl shadow-lg border ${border} p-6 flex flex-col md:col-span-2 hover:shadow-xl transition-shadow`}>
                <div className="flex items-center mb-3">
                  <ClipboardList className={`h-5 w-5 ${icon} mr-2`} />
                  <h2 className={`text-lg font-bold ${text} tracking-tight`}>SQA Remarks</h2>
                </div>
                
                <div className="space-y-4">
                  {sqaRemarks.map((remark, idx) => (
                    <div key={`sqa-${idx}`} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div className={`text-xs ${text} mb-2`}>
                        {new Date(remark.date).toLocaleDateString()}
                      </div>
                      <div className="space-y-2">
                        {remark.remarks.map((point, pIdx) => (
                          <p key={`sqa-point-${idx}-${pIdx}`} className="text-gray-700 text-sm">
                            {point}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Project Metadata */}
            <section className={`bg-white rounded-2xl shadow-lg border ${border} p-6 flex flex-col md:col-span-2 hover:shadow-xl transition-shadow`}>
              <div className="flex items-center mb-3">
                <Info className={`h-5 w-5 ${icon} mr-2`} />
                <h2 className={`text-lg font-bold ${text} tracking-tight`}>Project Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-600">Billing Model:</span>
                  <p className="text-gray-800">{project.billingModel}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Delivery Model:</span>
                  <p className="text-gray-800">{latestStatus?.deliveryModel || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Importance:</span>
                  <p className="text-gray-800">{project.importance}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-600">WSR Published:</span>
                  <p className="text-gray-800">{project.wsrPublisYesNo === 'Y' ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Status:</span>
                  <p className="text-gray-800">{project.isActive ? 'Active' : 'Inactive'}</p>
                </div>
                {latestStatus && (
                  <div>
                    <span className="font-semibold text-gray-600">Last Updated:</span>
                    <p className="text-gray-800">{new Date(latestStatus.reportingDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}