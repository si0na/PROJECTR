import React from "react";
import { Link } from "wouter";
import { ArrowLeft, Info, ClipboardList, AlertTriangle, CheckCircle, RefreshCw, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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

// Enhanced helper function to parse text into points with sentence splitting
const parseTextToPoints = (text: string): string[] => {
  if (!text || text.trim() === '') return [];
  
  // First split by common delimiters like newlines, bullet points, or numbered lists
  const initialSplit = text.split(/\n|•|·|\d+\.|-/);
  
  // Then further split each item by periods (.) to separate sentences
  const sentences = initialSplit.flatMap(item => {
    const trimmed = item.trim();
    if (!trimmed) return [];
    
    // Split by period followed by space or end of string
    return trimmed.split(/\.\s+|\.$/).map(s => {
      const clean = s.trim();
      return clean ? clean + (s.endsWith('.') ? '.' : '') : '';
    }).filter(Boolean);
  });
  
  return sentences;
};

// Helper function to collect all values from multiple statuses
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
  
  // Remove duplicates while preserving order
  return Array.from(new Set(allValues));
};

// Helper function to extract tasks from action items
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
  // Get project id from URL
  const pathSegments = window.location.pathname.split("/");
  const id = pathSegments[pathSegments.length - 1];
  const [referrer, setReferrer] = React.useState("/");
  
  // Fetch projects data
  const { data: projects, isLoading: projectsLoading } = useQuery<ExternalProject[]>({
    queryKey: ["/api/projects/external"],
  });

  // Find the specific project
  const project = projects?.find(p => 
    p.projectId.toString() === id || 
    (p.projectCodeId && p.projectCodeId === id) ||
    p.projectId === parseInt(id)
  );

  // Get the latest project status and review
  const latestStatus = project?.projectStatuses && project.projectStatuses.length > 0 
    ? project.projectStatuses.sort((a, b) => new Date(b.reportingDate).getTime() - new Date(a.reportingDate).getTime())[0]
    : null;
  
  const latestReview = project?.projectReviews && project.projectReviews.length > 0 
    ? project.projectReviews.sort((a, b) => new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime())[0]
    : null;

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
          <Link href={referrer}>
  <a className="flex items-center text-blue-600 hover:text-blue-800 font-semibold text-lg transition">
    <ArrowLeft className="h-5 w-5 mr-2" /> 
    Back to {referrer === '/projects' ? 'Projects' : 'Dashboard'}
  </a>
</Link>
        </div>
      </div>
    );
  }

  // Parse data from ALL statuses
  const updateSummary = collectAllStatusValues(project.projectStatuses, 'keyWeeklyUpdates');
  const issues = collectAllStatusValues(project.projectStatuses, 'issuesChallenges');
  const mitigation = collectAllStatusValues(project.projectStatuses, 'planForGreen');
  const nextSteps = collectAllStatusValues(project.projectStatuses, 'planForNextWeek');
  const tasks = latestReview?.actionItemsRecommendations
    ? parseActionItemsToTasks(latestReview.actionItemsRecommendations)
    : [];

  // Group AI assessments and SQA remarks by date
  const aiAssessments = project.projectStatuses
    ?.filter(s => s.llmAiAssessmentDescription)
    .map(s => ({
      date: s.reportingDate,
      status: s.llmAiStatus,
      description: parseTextToPoints(s.llmAiAssessmentDescription)
    })) || [];

  const sqaRemarks = project.projectStatuses
    ?.filter(s => s.sqaRemarks)
    .map(s => ({
      date: s.reportingDate,
      remarks: parseTextToPoints(s.sqaRemarks)
    })) || [];

  // Get all client escalations
  const clientEscalations = project.projectStatuses
    ?.filter(s => s.clientEscalation && s.clientEscalationDetails)
    .map(s => ({
      date: s.reportingDate,
      details: s.clientEscalationDetails
    })) || [];

  return (
    <div className="min-h-[calc(100vh-0px)] w-ful flex flex-col items-stretch bg-gradient-to-br from-blue-50 to-indigo-50 animate-fade-in">
      {/* Sticky Back Button */}
      <div className="sticky top-0 z-20 bg-gradient-to-br from-blue-50 to-indigo-50/80 py-4 px-2 sm:px-6 md:px-12 lg:px-24 xl:px-32 shadow-sm flex items-center">
      <Link href={referrer}>
  <a className="flex items-center text-blue-600 hover:text-blue-800 font-semibold text-lg transition">
    <ArrowLeft className="h-5 w-5 mr-2" /> 
    Back to {referrer === '/projects' ? 'Projects' : 'Dashboard'}
  </a>
</Link>
      </div>
      
      <div className="flex flex-col flex-grow items-center justify-center py-8 px-2 sm:px-6 md:px-12 lg:px-24 xl:px-32">
        <div className="w-full flex flex-col gap-12">
          {/* Project Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-3 tracking-tight">
                <Info className="h-7 w-7 text-indigo-500" /> 
                {project.projectName}
                <span className="text-lg font-semibold text-indigo-700">AI Analysis & Details</span>
              </h1>
              <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-600">
                {project.projectCodeId && (
                  <span className="bg-blue-100 px-2 py-1 rounded">Code: {project.projectCodeId}</span>
                )}
                <span className="bg-blue-100 px-2 py-1 rounded">ID: {project.projectId}</span>
                <span className="bg-green-100 px-2 py-1 rounded">PM: {project.projectManagerName}</span>
                <span className="bg-yellow-100 px-2 py-1 rounded">Account: {project.account}</span>
                <span className="bg-purple-100 px-2 py-1 rounded">Tower: {project.tower}</span>
                <span className="bg-orange-100 px-2 py-1 rounded">FTE: {project.fte}</span>
                <span className={`px-2 py-1 rounded ${
                  latestStatus?.ragStatus === 'Green' ? 'bg-green-200' :
                  latestStatus?.ragStatus === 'Amber' || latestStatus?.ragStatus === 'Yellow' ? 'bg-yellow-200' :
                  latestStatus?.ragStatus === 'Red' ? 'bg-red-200' : 'bg-gray-200'
                }`}>
                  Status: {latestStatus?.ragStatus || 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Update Summary */}
            <section className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6 flex flex-col hover:shadow-2xl transition-shadow">
              <div className="flex items-center mb-3">
                <ClipboardList className="h-5 w-5 text-blue-500 mr-2" />
                <h2 className="text-lg font-bold text-blue-900 tracking-tight">All Weekly Updates</h2>
              </div>
              {updateSummary.length > 0 ? (
                <div className="space-y-2">
                  {updateSummary.map((item, idx) => (
                    <div key={idx} className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
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
            <section className="bg-white rounded-2xl shadow-lg border border-yellow-100 p-6 flex flex-col hover:shadow-2xl transition-shadow">
              <div className="flex items-center mb-3">
                <ClipboardList className="h-5 w-5 text-yellow-500 mr-2" />
                <h2 className="text-lg font-bold text-yellow-900 tracking-tight">Action Items & Tasks</h2>
              </div>
              {tasks.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full border text-sm rounded-lg overflow-hidden">
                    <thead className="bg-yellow-100">
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

            {/* Key Issues / Challenges */}
            <section className="bg-white rounded-2xl shadow-lg border border-red-100 p-6 flex flex-col md:col-span-2 hover:shadow-2xl transition-shadow">
              <div className="flex items-center mb-3">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                <h2 className="text-lg font-bold text-red-900 tracking-tight">All Issues & Challenges</h2>
                {clientEscalations.length > 0 && (
                  <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                    {clientEscalations.length} Client Escalation(s)
                  </span>
                )}
              </div>
              {issues.length > 0 ? (
                <div className="space-y-2">
                  {issues.map((item, idx) => (
                    <div key={idx} className="flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      <p className="text-gray-700 text-sm">{item}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 italic text-sm">
                  <p>No issues or challenges reported across all status updates.</p>
                </div>
              )}

              {/* Show all client escalation details */}
              {clientEscalations.map((escalation, idx) => (
                <div key={`escalation-${idx}`} className="mt-4 p-3 bg-red-50 border-l-4 border-red-400">
                  <p className="text-sm text-red-700">
                    <strong>Escalation on {new Date(escalation.date).toLocaleDateString()}:</strong> 
                    {" "}{escalation.details}
                  </p>
                </div>
              ))}
            </section>

            {/* Mitigation & Path to Green Plan */}
            <section className="bg-white rounded-2xl shadow-lg border border-green-100 p-6 flex flex-col md:col-span-2 hover:shadow-2xl transition-shadow">
              <div className="flex items-center mb-3">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <h2 className="text-lg font-bold text-green-900 tracking-tight">All Path to Green Plans</h2>
              </div>
              {mitigation.length > 0 ? (
                <div className="space-y-2">
                  {mitigation.map((item, idx) => (
                    <div key={idx} className="flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      <p className="text-gray-700 text-sm">{item}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 italic text-sm">
                  <p>No specific path to green plan documented.</p>
                  {latestStatus?.ragStatus === 'Green' && (
                    <p className="mt-1 text-green-600">✓ Project is already in Green status.</p>
                  )}
                </div>
              )}
            </section>

            {/* Next Steps */}
            <section className="bg-white rounded-2xl shadow-lg border border-indigo-100 p-6 flex flex-col md:col-span-2 hover:shadow-2xl transition-shadow">
              <div className="flex items-center mb-3">
                <RefreshCw className="h-5 w-5 text-indigo-500 mr-2" />
                <h2 className="text-lg font-bold text-indigo-900 tracking-tight">All Next Steps</h2>
                {latestStatus?.currentSdlcPhase && (
                  <span className="ml-auto bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded">
                    Current Phase: {latestStatus.currentSdlcPhase}
                  </span>
                )}
              </div>
              {nextSteps.length > 0 ? (
                <div className="space-y-2">
                  {nextSteps.map((item, idx) => (
                    <div key={idx} className="flex items-start">
                      <span className="text-indigo-500 mr-2">•</span>
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

            {/* AI Analysis Section */}
            {aiAssessments.length > 0 && (
              <section className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6 flex flex-col md:col-span-2 hover:shadow-2xl transition-shadow">
                <div className="flex items-center mb-3">
                  <Info className="h-5 w-5 text-purple-500 mr-2" />
                  <h2 className="text-lg font-bold text-purple-900 tracking-tight">All AI Assessments</h2>
                </div>
                
                <div className="space-y-4">
                  {aiAssessments.map((assessment, idx) => (
                    <div key={`ai-${idx}`} className="border-b border-purple-50 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center mb-2">
                        <span className="text-xs text-purple-600">
                          {new Date(assessment.date).toLocaleDateString()}
                        </span>
                        <span className="ml-2 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
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

            {/* SQA Remarks Section */}
            {sqaRemarks.length > 0 && (
              <section className="bg-white rounded-2xl shadow-lg border border-orange-100 p-6 flex flex-col md:col-span-2 hover:shadow-2xl transition-shadow">
                <div className="flex items-center mb-3">
                  <ClipboardList className="h-5 w-5 text-orange-500 mr-2" />
                  <h2 className="text-lg font-bold text-orange-900 tracking-tight">All SQA Remarks</h2>
                </div>
                
                <div className="space-y-4">
                  {sqaRemarks.map((remark, idx) => (
                    <div key={`sqa-${idx}`} className="border-b border-orange-50 pb-4 last:border-0 last:pb-0">
                      <div className="text-xs text-orange-600 mb-2">
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
            <section className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex flex-col md:col-span-2 hover:shadow-2xl transition-shadow">
              <div className="flex items-center mb-3">
                <Info className="h-5 w-5 text-gray-500 mr-2" />
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">Project Information</h2>
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