import { cn } from "@/lib/utils";
import { ExternalLink, Bot, AlertTriangle } from "lucide-react";
import type { Project, WeeklyStatusReport, User } from "@shared/schema";
import React, { useState } from "react";
import { Link } from "wouter";

interface ProjectCardProps {
  project: Project & { projectManager?: User };
  latestReport?: WeeklyStatusReport;
  onClick?: () => void;
}

export function ProjectCard({ project, latestReport, onClick }: ProjectCardProps) {
  // Remove modal state and logic
  // const [modalOpen, setModalOpen] = useState(false);

  if (!latestReport) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-gray-900 mb-1">{project.name}</h4>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              No Reports
            </span>
          </div>
          <Link href={`/projects/${project.id}`}>
            <a className="text-gray-400 hover:text-gray-600">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Link>
        </div>
        <p className="text-sm text-gray-500">No weekly reports submitted yet.</p>
      </div>
    );
  }

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

  const ragStyles = getRagStatusStyles(project.ragStatus || latestReport.healthCurrentWeek || 'Green');
  const aiRagStyles = latestReport.aiStatus ? getRagStatusStyles(latestReport.aiStatus) : ragStyles;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between h-full">
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-gray-900 mb-1">{project.name}</h4>
            <div className="flex items-center space-x-2 mb-2">
              <span className={cn(
                "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                ragStyles.badge
              )}>
                <div className={cn("mr-1", ragStyles.dotClass)}></div>
                {project.ragStatus || latestReport.healthCurrentWeek || 'Green'}
              </span>
              <span className={cn(
                "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                getPriorityStyles(project.projectImportance)
              )}>
                {project.projectImportance} Priority
              </span>
            </div>
          </div>
          <Link href={`/projects/${project.id}`}>
            <a className="text-gray-400 hover:text-gray-600">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Link>
        </div>
        
        {/* AI Assessment */}
        {latestReport.aiAssessmentDescription && (
          <div className={cn("border rounded-lg p-3 mb-4", aiRagStyles.aiBox)}>
            <div className="flex items-start space-x-2">
              <Bot className={cn("mt-0.5 h-4 w-4", aiRagStyles.iconColor)} />
              <div className="flex-1">
                <p className={cn("text-sm font-medium", aiRagStyles.iconColor.replace('text-', 'text-').replace('-600', '-800'))}>
                  AI Assessment
                </p>
                <p className={cn("text-sm mt-1", aiRagStyles.iconColor.replace('text-', 'text-').replace('-600', '-700'))}>
                  {latestReport.aiAssessmentDescription}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">PM:</span>
            <span className="font-medium text-gray-900">
              {project.projectManager?.name || 'Not assigned'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Delivery Model:</span>
            <span className="font-medium text-gray-900">{project.deliveryModel}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Client Escalation:</span>
            <span className={cn(
              "font-medium",
              (latestReport.clientEscalation && latestReport.clientEscalation !== "None") ? "text-red-600 flex items-center" : "text-gray-600"
            )}>
              {(latestReport.clientEscalation && latestReport.clientEscalation !== "None") ? (
                <>
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {latestReport.clientEscalation}
                </>
              ) : (
                "None"
              )}
            </span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100 flex-1">
          <p className="text-sm text-gray-600 mb-2">Latest Update:</p>
          <p className="text-sm text-gray-800 line-clamp-3">{latestReport.updateForCurrentWeek || 'No recent updates'}</p>
        </div>
      </div>
      {/* View Button at bottom right */}
      <div className="flex justify-end items-center p-4 pt-0">
        <Link href={`/projects/${project.id}`}>
          <a className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition-all focus:outline-none focus:ring-2 focus:ring-blue-400">
            View
          </a>
        </Link>
      </div>
    </div>
  );
}
