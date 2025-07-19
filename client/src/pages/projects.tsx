import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Filter,
  User as UserIcon,
  Building,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { ExternalProjectCard } from "@/components/dashboard/external-project-card";
import { ProjectForm } from "@/components/forms/project-form";
import { useAuth } from "@/hooks/use-auth";
import { USER_ROLES } from "@/lib/constants";
import type { Project, WeeklyStatusReport, User, ExternalProject } from "@shared/schema";

export default function Projects() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [importanceFilter, setImportanceFilter] = useState<string>("all");
  const [managerFilter, setManagerFilter] = useState<string>("all");
  const [escalationFilter, setEscalationFilter] = useState<string>("all");
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12); // Show 12 projects per page

  const { user } = useAuth();

  const { data: projects, isLoading: projectsLoading } = useQuery<ExternalProject[]>({
    queryKey: ["/api/projects/external"],
  });

  const filteredProjects =
    projects?.filter((project) => {
      // Search filter
      if (
        searchTerm &&
        !project.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !project.account?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !project.projectCodeId?.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Get latest status from project statuses
      const latestStatus = project.projectStatuses && project.projectStatuses.length > 0 
        ? project.projectStatuses.sort((a, b) => new Date(b.reportingDate).getTime() - new Date(a.reportingDate).getTime())[0]
        : null;

      // Status filter - using latest status's ragStatus
      if (
        statusFilter !== "all" &&
        latestStatus?.ragStatus?.toLowerCase() !== statusFilter
      ) {
        return false;
      }

      // Importance filter - using project's importance
      if (
        importanceFilter !== "all" &&
        project.importance?.toLowerCase() !== importanceFilter
      ) {
        return false;
      }

      // Manager filter - using project manager name
      if (
        managerFilter !== "all" &&
        project.projectManagerName !== managerFilter
      ) {
        return false;
      }

      // Escalation filter
      if (escalationFilter === "escalated" && !latestStatus?.clientEscalation) {
        return false;
      }
      if (
        escalationFilter === "not_escalated" &&
        latestStatus?.clientEscalation
      ) {
        return false;
      }

      return true;
    }) || [];

  // Pagination logic
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProjects = filteredProjects.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const resetToFirstPage = () => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  // PM names from the provided Excel data
  const pmNames = [
    "Vijo Jacob",
    "Rajeev Kallumpurath",
    "Ashwathy Nair",
    "Srinivasan K R",
    "Rajakrishnan S",
    "Yamunaa Rani",
    "Amitha M N",
    "Prakash S",
    "Umesh Choudhary",
    "Shanavaz",
  ];

  // Effect to reset page when filters change would go here, but we'll handle it inline

  const isLoading = projectsLoading;
  const canCreateProjects =
    user?.role === USER_ROLES.DELIVERY_MANAGER ||
    user?.role === USER_ROLES.ADMIN;

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Projects
                {!projectsLoading && projects && (
                  <span className="text-lg font-normal text-gray-500 ml-2">
                    ({projects.length} total)
                  </span>
                )}
              </h1>
              <p className="text-gray-600 mt-1">
                Manage and monitor your project portfolio
              </p>
            </div>

            {canCreateProjects && (
              <div className="flex gap-2">
                <Dialog
                  open={createProjectOpen}
                  onOpenChange={setCreateProjectOpen}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Project
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Project</DialogTitle>
                      <DialogDescription>
                        Fill in the project details below. Fields marked with *
                        are required.
                      </DialogDescription>
                    </DialogHeader>
                    <ProjectForm
                      onSuccess={() => setCreateProjectOpen(false)}
                      onCancel={() => setCreateProjectOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
                {/* Upload Project Button with Dialog */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12"
                        />
                      </svg>
                      Upload Project
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Upload Project Data</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv,.pdf,.doc,.docx"
                        className="block w-full text-sm text-gray-700"
                      />
                      <Button>Upload</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search projects by name or customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Combined filter dropdown with checkboxes and sort button */}
            <div className="flex gap-3 items-center">
              <Select>
                <SelectTrigger className="w-56">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter Projects" />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-3 py-2">
                    <label className="block font-medium mb-1">Status</label>
                    <div className="flex flex-col gap-1 mb-2">
                      <label>
                        <input
                          type="checkbox"
                          checked={statusFilter === "green"}
                          onChange={() =>
                            setStatusFilter(
                              statusFilter === "green" ? "all" : "green"
                            )
                          }
                        />{" "}
                        Green
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={statusFilter === "amber"}
                          onChange={() =>
                            setStatusFilter(
                              statusFilter === "amber" ? "all" : "amber"
                            )
                          }
                        />{" "}
                        Amber
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={statusFilter === "red"}
                          onChange={() =>
                            setStatusFilter(
                              statusFilter === "red" ? "all" : "red"
                            )
                          }
                        />{" "}
                        Red
                      </label>
                    </div>
                    <label className="block font-medium mb-1">Priority</label>
                    <div className="flex flex-col gap-1 mb-2">
                      <label>
                        <input
                          type="checkbox"
                          checked={importanceFilter === "high"}
                          onChange={() =>
                            setImportanceFilter(
                              importanceFilter === "high" ? "all" : "high"
                            )
                          }
                        />{" "}
                        High
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={importanceFilter === "medium"}
                          onChange={() =>
                            setImportanceFilter(
                              importanceFilter === "medium" ? "all" : "medium"
                            )
                          }
                        />{" "}
                        Medium
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={importanceFilter === "low"}
                          onChange={() =>
                            setImportanceFilter(
                              importanceFilter === "low" ? "all" : "low"
                            )
                          }
                        />{" "}
                        Low
                      </label>
                    </div>
                    <label className="block font-medium mb-1">PM</label>
                    <div className="flex flex-col gap-1 mb-2">
                      {pmNames.map((pm) => (
                        <label key={pm}>
                          <input
                            type="checkbox"
                            checked={managerFilter === pm}
                            onChange={() =>
                              setManagerFilter(
                                managerFilter === pm ? "all" : pm
                              )
                            }
                          />{" "}
                          {pm}
                        </label>
                      ))}
                    </div>
                    <label className="block font-medium mb-1">Escalation</label>
                    <div className="flex flex-col gap-1">
                      <label>
                        <input
                          type="checkbox"
                          checked={escalationFilter === "escalated"}
                          onChange={() =>
                            setEscalationFilter(
                              escalationFilter === "escalated"
                                ? "all"
                                : "escalated"
                            )
                          }
                        />{" "}
                        Escalated
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={escalationFilter === "not_escalated"}
                          onChange={() =>
                            setEscalationFilter(
                              escalationFilter === "not_escalated"
                                ? "all"
                                : "not_escalated"
                            )
                          }
                        />{" "}
                        Not Escalated
                      </label>
                    </div>
                  </div>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-36">
                  <span>Sort</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-16 bg-gray-200 rounded mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-500">
              <h3 className="text-lg font-medium mb-2">No projects found</h3>
              <p>
                {searchTerm ||
                statusFilter !== "all" ||
                importanceFilter !== "all"
                  ? "Try adjusting your filters to see more projects."
                  : "Get started by creating your first project."}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Results Summary */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-600">
                Showing {startIndex + 1}-
                {Math.min(endIndex, filteredProjects.length)} of{" "}
                {filteredProjects.length} projects
                {filteredProjects.length !== projects?.length &&
                  ` (filtered from ${projects?.length} total)`}
              </p>

              {(searchTerm ||
                statusFilter !== "all" ||
                importanceFilter !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setImportanceFilter("all");
                    setCurrentPage(1);
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {currentProjects.map((project) => (
                <ExternalProjectCard
                  key={project.projectId}
                  project={project}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      // Show first page, last page, current page, and pages around current
                      return (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 2 && page <= currentPage + 2)
                      );
                    })
                    .map((page, index, array) => {
                      // Add ellipsis if there's a gap
                      const showEllipsis =
                        index > 0 && page - array[index - 1] > 1;
                      return (
                        <div key={page} className="flex items-center">
                          {showEllipsis && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                          <Button
                            variant={
                              currentPage === page ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="min-w-[2.5rem]"
                          >
                            {page}
                          </Button>
                        </div>
                      );
                    })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
