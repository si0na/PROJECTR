import { useState } from "react";
// import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  RefreshCw,
  Download,
  ClipboardCheck,
  Bot,
  ArrowRight,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AIAssessmentHeader } from "@/components/dashboard/ai-assessment-header";
import { SearchBar } from "@/components/dashboard/search-bar";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { AnalyticsOverview } from "@/components/dashboard/analytics-overview";
import { ProjectCard } from "@/components/dashboard/project-card";
import { WeeklyReportForm } from "@/components/forms/weekly-report-form";
import { useAuth } from "@/hooks/use-auth";
import { USER_ROLES } from "@/lib/constants";
import type { Project, WeeklyStatusReport } from "@shared/schema";

export default function Dashboard() {
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [importanceFilter, setImportanceFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { user } = useAuth();

  // Static real project data from Excel image
  const projects = [
    {
      id: 1,
      name: "KAV",
      pm: "Vijo Jacob",
      customer: "KAV",
      ragStatus: "Red",
      projectImportance: "High",
      clientEscalation: true,
    },
    {
      id: 2,
      name: "BOSCH",
      pm: "Rajeev Kallumpurath",
      customer: "BOSCH",
      ragStatus: "Amber",
      projectImportance: "Medium",
      clientEscalation: false,
    },
    {
      id: 3,
      name: "Ashwathy Project",
      pm: "Ashwathy Nair",
      customer: "Ashwathy Customer",
      ragStatus: "Amber",
      projectImportance: "Medium",
      clientEscalation: false,
    },
    {
      id: 4,
      name: "Srinivasan Project",
      pm: "Srinivasan K R",
      customer: "Srinivasan Customer",
      ragStatus: "Amber",
      projectImportance: "Medium",
      clientEscalation: false,
    },
    {
      id: 5,
      name: "Project X",
      pm: "Rajakrishnan S",
      customer: "X Customer",
      ragStatus: "Green",
      projectImportance: "Low",
      clientEscalation: false,
    },
    {
      id: 6,
      name: "Project Y",
      pm: "Yamunaa Rani",
      customer: "Y Customer",
      ragStatus: "Green",
      projectImportance: "Low",
      clientEscalation: false,
    },
    {
      id: 7,
      name: "Project Z",
      pm: "Amitha M N",
      customer: "Z Customer",
      ragStatus: "Green",
      projectImportance: "Low",
      clientEscalation: false,
    },
    {
      id: 8,
      name: "Prakash Project",
      pm: "Prakash S",
      customer: "Prakash Customer",
      ragStatus: "Green",
      projectImportance: "Low",
      clientEscalation: false,
    },
    {
      id: 9,
      name: "Umesh Project",
      pm: "Umesh Choudhary",
      customer: "Umesh Customer",
      ragStatus: "Green",
      projectImportance: "Low",
      clientEscalation: false,
    },
    {
      id: 10,
      name: "Shanavaz Project",
      pm: "Shanavaz",
      customer: "Shanavaz Customer",
      ragStatus: "Green",
      projectImportance: "Low",
      clientEscalation: false,
    },
  ];

  // Simulate weeklyReports for dashboard logic
  const weeklyReports = projects.map((p, idx) => ({
    id: idx + 1,
    projectId: p.id,
    ragStatus: p.ragStatus,
    projectImportance: p.projectImportance,
    clientEscalation: p.clientEscalation,
    createdAt: new Date().toISOString(),
  }));

  const projectsLoading = false;
  const reportsLoading = false;

  // No-op for handleRefresh since we use static data
  const handleRefresh = () => {};

  const getLatestReportForProject = (projectId: number) => {
    return weeklyReports.find((r) => r.projectId === projectId);
  };

  const filteredProjects =
    projects?.filter((project) => {
      const latestReport = getLatestReportForProject(project.id);

      // Search filter
      if (
        searchQuery &&
        !project.name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !project.customer?.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Status filter
      if (
        statusFilter !== "all" &&
        (!latestReport ||
          latestReport.ragStatus?.toLowerCase() !== statusFilter)
      ) {
        return false;
      }

      // Importance filter
      if (
        importanceFilter !== "all" &&
        (!latestReport ||
          latestReport.projectImportance?.toLowerCase() !== importanceFilter)
      ) {
        return false;
      }

      return true;
    }) || [];

  // Get high priority projects for dashboard
  const getDashboardProjects = () => {
    if (!projects || !weeklyReports) return [];

    return projects
      .map((project) => ({
        ...project,
        latestReport: getLatestReportForProject(project.id),
      }))
      .filter(
        (project) =>
          project.latestReport &&
          (project.latestReport.ragStatus === "Red" ||
            project.latestReport.clientEscalation ||
            project.latestReport.projectImportance === "High")
      )
      .sort((a, b) => {
        // Sort by priority: Red > Escalation > High Importance
        const getPriority = (proj: any) => {
          if (proj.latestReport?.ragStatus === "Red") return 3;
          if (proj.latestReport?.clientEscalation) return 2;
          if (proj.latestReport?.projectImportance === "High") return 1;
          return 0;
        };
        return getPriority(b) - getPriority(a);
      })
      .slice(0, 6);
  };

  const dashboardProjects = getDashboardProjects();

  const isLoading = projectsLoading || reportsLoading;

  return (
    <div className="bg-gray-50 min-h-full">
      <AIAssessmentHeader />

      <div className="max-w-7xl mx-auto p-8">
        {/* Header with filters */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Portfolio Dashboard
            </h1>
            <p className="text-gray-600">
              Real-time insights and priority project tracking
            </p>
          </div>

          {/* Removed status/priority dropdowns and refresh icon for a cleaner, more relevant dashboard header */}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Analytics and Priority Projects */}
          <div className="xl:col-span-2 space-y-8">
            {/* Analytics Overview */}
            <AnalyticsOverview />
          </div>

          {/* Right Column - Quick Actions */}
          <div className="space-y-8">
          </div>
        </div>
      </div>
    </div>
  );
}