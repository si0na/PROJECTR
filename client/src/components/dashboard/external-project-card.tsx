import { cn } from "@/lib/utils";
import { ExternalLink, Bot, AlertTriangle, Calendar, User, Building } from "lucide-react";
import type { ExternalProject } from "@shared/schema";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ExternalProjectCardProps {
  project: ExternalProject;
  onClick?: () => void;
}

export function ExternalProjectCard({ project, onClick }: ExternalProjectCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Get the latest status from project statuses
  const latestStatus = project.projectStatuses && project.projectStatuses.length > 0 
    ? project.projectStatuses.sort((a, b) => new Date(b.reportingDate).getTime() - new Date(a.reportingDate).getTime())[0]
    : null;

  const getRagStatusStyles = (status: string) => {
    switch (status?.toLowerCase() || '') {
      case 'green':
        return {
          badge: 'bg-green-100 text-green-800',
          aiBox: 'bg-green-50 border-green-200',
          iconColor: 'text-green-600',
          dotClass: 'rag-dot-green'
        };
      case 'amber':
        return {
          badge: 'bg-yellow-100 text-yellow-800',
          aiBox: 'bg-yellow-50 border-yellow-200',
          iconColor: 'text-yellow-600',
          dotClass: 'rag-dot-amber'
        };
      case 'red':
        return {
          badge: 'bg-red-100 text-red-800',
          aiBox: 'bg-red-50 border-red-200',
          iconColor: 'text-red-600',
          dotClass: 'rag-dot-red'
        };
      default:
        return {
          badge: 'bg-gray-100 text-gray-800',
          aiBox: 'bg-gray-50 border-gray-200',
          iconColor: 'text-gray-600',
          dotClass: 'w-2 h-2 rounded-full bg-gray-600'
        };
    }
  };

  const getPriorityStyles = (importance: string) => {
    switch (importance?.toLowerCase() || '') {
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const ragStyles = getRagStatusStyles(latestStatus?.ragStatus || '');
  const priorityStyles = getPriorityStyles(project.importance);

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">{project.projectName}</h4>
            <div className="flex items-center gap-2 mb-3">
              <span className={cn("inline-flex items-center px-2 py-1 rounded-full text-xs font-medium", ragStyles.badge)}>
                {latestStatus?.ragStatus || 'No Status'}
              </span>
              <span className={cn("inline-flex items-center px-2 py-1 rounded-full text-xs font-medium", priorityStyles)}>
                {project.importance}
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDetailsOpen(true)}
            className="ml-2"
          >
            View Details
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <User className="h-4 w-4 mr-2" />
            <span>PM: {project.projectManagerName}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Building className="h-4 w-4 mr-2" />
            <span>{project.account}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <span className="font-medium mr-2">Tower:</span>
            <span>{project.tower}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <span className="font-medium mr-2">FTE:</span>
            <span>{project.fte}</span>
          </div>
        </div>

        {latestStatus && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600 line-clamp-2">
              {latestStatus.keyWeeklyUpdates}
            </p>
            {latestStatus.clientEscalation && (
              <div className="mt-2 flex items-center text-sm text-red-600">
                <AlertTriangle className="h-4 w-4 mr-1" />
                <span>Client Escalation</span>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{project.projectName}</DialogTitle>
            <DialogDescription>
              Project ID: {project.projectId} | {project.projectCodeId || 'No Code ID'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Project Overview */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">Project Details</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Account:</span> {project.account}</p>
                  <p><span className="font-medium">Project Manager:</span> {project.projectManagerName}</p>
                  <p><span className="font-medium">Tower:</span> {project.tower}</p>
                  <p><span className="font-medium">FTE:</span> {project.fte}</p>
                  <p><span className="font-medium">Billing Model:</span> {project.billingModel}</p>
                  <p><span className="font-medium">Importance:</span> {project.importance}</p>
                  <p><span className="font-medium">WSR Published:</span> {project.wsrPublisYesNo}</p>
                  <p><span className="font-medium">Active:</span> {project.isActive ? 'Yes' : 'No'}</p>
                </div>
              </div>
              
              {latestStatus && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">Latest Status</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">RAG Status:</span> 
                      <Badge className={cn("ml-2", ragStyles.badge)}>{latestStatus.ragStatus}</Badge>
                    </p>
                    <p><span className="font-medium">Reporting Date:</span> {new Date(latestStatus.reportingDate).toLocaleDateString()}</p>
                    <p><span className="font-medium">Delivery Model:</span> {latestStatus.deliveryModel}</p>
                    <p><span className="font-medium">SDLC Phase:</span> {latestStatus.currentSdlcPhase || 'Not specified'}</p>
                    <p><span className="font-medium">Client Escalation:</span> {latestStatus.clientEscalation ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Project Statuses */}
            {project.projectStatuses && project.projectStatuses.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Status Reports</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {project.projectStatuses
                    .sort((a, b) => new Date(b.reportingDate).getTime() - new Date(a.reportingDate).getTime())
                    .map((status, index) => (
                    <div key={status.statusId} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">
                          Report #{status.statusId} - {new Date(status.reportingDate).toLocaleDateString()}
                        </h4>
                        <Badge className={cn(getRagStatusStyles(status.ragStatus).badge)}>
                          {status.ragStatus}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Weekly Updates:</span>
                          <p className="mt-1 text-gray-700">{status.keyWeeklyUpdates}</p>
                        </div>
                        
                        {status.planForNextWeek && (
                          <div>
                            <span className="font-medium">Plan for Next Week:</span>
                            <p className="mt-1 text-gray-700">{status.planForNextWeek}</p>
                          </div>
                        )}
                        
                        {status.issuesChallenges && (
                          <div>
                            <span className="font-medium">Issues & Challenges:</span>
                            <p className="mt-1 text-gray-700">{status.issuesChallenges}</p>
                          </div>
                        )}
                        
                        {status.planForGreen && (
                          <div>
                            <span className="font-medium">Plan for Green:</span>
                            <p className="mt-1 text-gray-700">{status.planForGreen}</p>
                          </div>
                        )}
                        
                        {status.sqaRemarks && (
                          <div>
                            <span className="font-medium">SQA Remarks:</span>
                            <p className="mt-1 text-gray-700">{status.sqaRemarks}</p>
                          </div>
                        )}
                        
                        {status.clientEscalation && status.clientEscalationDetails && (
                          <div className="bg-red-50 p-2 rounded border-l-4 border-red-400">
                            <span className="font-medium text-red-800">Client Escalation:</span>
                            <p className="mt-1 text-red-700">{status.clientEscalationDetails}</p>
                          </div>
                        )}
                        
                        {status.llmAiStatus && (
                          <div className="bg-blue-50 p-2 rounded border-l-4 border-blue-400">
                            <span className="font-medium text-blue-800">AI Assessment ({status.llmAiStatus}):</span>
                            <p className="mt-1 text-blue-700">{status.llmAiAssessmentDescription}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}