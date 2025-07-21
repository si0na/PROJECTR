import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Filter, Eye, Calendar, Download, ChevronDown, ChevronUp } from "lucide-react";
import * as XLSX from "xlsx";
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
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeeklyReportForm } from "@/components/forms/weekly-report-form";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import type { WeeklyStatusReport, Project, User } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type EnrichedWeeklyReport = Omit<WeeklyStatusReport, "submittedBy"> & {
  project?: Project;
  submittedBy?: User;
};

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

export default function WeeklyReports() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] =
    useState<EnrichedWeeklyReport | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedPMs, setSelectedPMs] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { user } = useAuth();

  const { data: reports, isLoading: reportsLoading } = useQuery<
    EnrichedWeeklyReport[]
  >({
    queryKey: ["/api/weekly-reports"],
  });

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });
  // other fields...
  // other fields...
// In your type definitions (e.g., types/project.ts)
interface Project {
  projectId: number;
  projectName: string;
  // other fields...
  codeId: string;
  account: string;
  customer: string;
  // etc...
}
  const getRagStatusStyles = (status: string) => {
    switch (status?.toLowerCase() || "") {
      case "green":
        return "bg-green-100 text-green-800 border-green-200";
      case "amber":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "red":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const filteredReports =
    reports?.filter((report) => {
      // Search filter
      if (
        searchTerm &&
        !report.project?.name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) &&
        !report.updateForCurrentWeek
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Status filter - using healthCurrentWeek from our Excel schema
      if (
        selectedStatuses.length > 0 &&
        !selectedStatuses.includes(
          report.healthCurrentWeek?.toLowerCase() || ""
        )
      ) {
        return false;
      }

      // Project filter
      if (
        projectFilter !== "all" &&
        report.projectId.toString() !== projectFilter
      ) {
        return false;
      }

      // PM filter
      if (
        selectedPMs.length > 0 &&
        !selectedPMs.includes(report.submittedBy?.name || "")
      ) {
        return false;
      }

      return true;
    }) || [];

  const sortedReports = filteredReports.sort(
    (a, b) =>
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
  );

  const handleViewReport = (report: EnrichedWeeklyReport) => {
    setSelectedReport(report);
    setViewModalOpen(true);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const exportToExcel = (allData: boolean = false) => {
    const dataToExport = allData ? reports : filteredReports;
    if (!dataToExport || dataToExport.length === 0) return;

    const exportData = dataToExport.map((report) => ({
      "Project Name": report.project?.name || "",
      Customer: report.project?.customer || "",
      "Week Number": report.weekNumber || "",
      "Reporting Date": formatDate(new Date(report.reportingDate)),
      "Current Week Update": report.updateForCurrentWeek || "",
      "Previous Week Health": report.healthPreviousWeek || "",
      "Current Week Health": report.healthCurrentWeek || "",
      "RAG Status": report.healthCurrentWeek || "",
      "Next Week Plan": report.planForNextWeek || "",
      Challenges: report.issuesChallenges || "",
      Tower: report.tower || "",
      "Billing Model": report.billingModel || "",
      "Submitted By": report.submittedBy?.name || "",
      "Submitted Date": formatDate(new Date(report.createdAt!)),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Weekly Reports");

    const fileName = `weekly-reports-${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const exportToCSV = (allData: boolean = false) => {
    const dataToExport = allData ? reports : filteredReports;
    if (!dataToExport || dataToExport.length === 0) return;

    const exportData = dataToExport.map((report) => ({
      "Project Name": report.project?.name || "",
      Customer: report.project?.customer || "",
      "Week Number": report.weekNumber || "",
      "Reporting Date": formatDate(new Date(report.reportingDate)),
      "Current Week Update": report.updateForCurrentWeek || "",
      "Previous Week Health": report.healthPreviousWeek || "",
      "Current Week Health": report.healthCurrentWeek || "",
      "RAG Status": report.healthCurrentWeek || "",
      "Next Week Plan": report.planForNextWeek || "",
      Challenges: report.issuesChallenges || "",
      Tower: report.tower || "",
      "Billing Model": report.billingModel || "",
      "Submitted By": report.submittedBy?.name || "",
      "Submitted Date": formatDate(new Date(report.createdAt!)),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const csv = XLSX.utils.sheet_to_csv(worksheet);

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `weekly-reports-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const togglePM = (pm: string) => {
    setSelectedPMs((prev) =>
      prev.includes(pm) ? prev.filter((p) => p !== pm) : [...prev, pm]
    );
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setProjectFilter("all");
    setSelectedStatuses([]);
    setSelectedPMs([]);
  };

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Weekly Reports
              </h1>
              <p className="text-gray-600 mt-1">
                Track project status and updates
              </p>
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    <span>Export</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => exportToExcel(false)}>
                    Export Current View (Excel)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportToCSV(false)}>
                    Export Current View (CSV)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportToExcel(true)}>
                    Export All Data (Excel)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportToCSV(true)}>
                    Export All Data (CSV)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Report
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Submit Weekly Status Report</DialogTitle>
                  </DialogHeader>
                  <WeeklyReportForm
                    onSuccess={() => setReportModalOpen(false)}
                    onCancel={() => setReportModalOpen(false)}
                  />
                </DialogContent>
              </Dialog>
              
              {/* Upload Reports Button */}
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
                    Upload Reports
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Upload Weekly Reports</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-4">
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="block w-full text-sm text-gray-700"
                    />
                    <Button>Upload</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
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
                  placeholder="Search reports by project or content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Select value={projectFilter} onValueChange={setProjectFilter}>
  <SelectTrigger className="w-48">
    <SelectValue placeholder="All Projects" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All Projects</SelectItem>
    {projects?.map((project) => (
      <SelectItem 
        key={project.projectId} 
        value={project.projectId.toString()}
      >
        {project.projectName}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
              <Collapsible
                open={filtersOpen}
                onOpenChange={setFiltersOpen}
                className="relative"
              >
                <CollapsibleTrigger asChild>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    {filtersOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-10 p-4 space-y-4">
                  <div>
                    <Label className="block mb-2 font-medium">Status</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="green"
                          checked={selectedStatuses.includes("green")}
                          onCheckedChange={() => toggleStatus("green")}
                        />
                        <Label htmlFor="green">Green</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="amber"
                          checked={selectedStatuses.includes("amber")}
                          onCheckedChange={() => toggleStatus("amber")}
                        />
                        <Label htmlFor="amber">Amber</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="red"
                          checked={selectedStatuses.includes("red")}
                          onCheckedChange={() => toggleStatus("red")}
                        />
                        <Label htmlFor="red">Red</Label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="block mb-2 font-medium">
                      Project Managers
                    </Label>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {pmNames.map((pm) => (
                        <div key={pm} className="flex items-center space-x-2">
                          <Checkbox
                            id={pm}
                            checked={selectedPMs.includes(pm)}
                            onCheckedChange={() => togglePM(pm)}
                          />
                          <Label htmlFor={pm}>{pm}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {(selectedStatuses.length > 0 || selectedPMs.length > 0) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedStatuses([]);
                        setSelectedPMs([]);
                      }}
                      className="mt-2"
                    >
                      Clear selection
                    </Button>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
        </div>

        {/* Reports List */}
        {reportsLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="animate-pulse">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : sortedReports.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-500">
              <h3 className="text-lg font-medium mb-2">No reports found</h3>
              <p>
                {searchTerm ||
                statusFilter !== "all" ||
                projectFilter !== "all" ||
                selectedStatuses.length > 0 ||
                selectedPMs.length > 0
                  ? "Try adjusting your filters to see more reports."
                  : "Get started by submitting your first weekly report."}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Results Summary */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-600">
                Showing {sortedReports.length} of {reports?.length || 0} reports
              </p>

              {(searchTerm ||
                statusFilter !== "all" ||
                projectFilter !== "all" ||
                selectedStatuses.length > 0 ||
                selectedPMs.length > 0) && (
                <Button variant="outline" size="sm" onClick={clearAllFilters}>
                  Clear Filters
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {sortedReports.map((report) => (
                <Card
                  key={report.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          {report.project?.name || "Unknown Project"}
                        </CardTitle>
                        <div className="flex items-center space-x-4 mt-2">
                          <Badge
                            className={cn(
                              "border",
                              getRagStatusStyles(
                                report.healthCurrentWeek || "Green"
                              )
                            )}
                          >
                            {report.healthCurrentWeek || "Green"}
                          </Badge>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(report.reportingDate)}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewReport(report)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          Project Manager
                        </p>
                        <p className="text-sm text-gray-600">
                          {report.submittedBy?.name || "Unknown"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          Billing Model
                        </p>
                        <p className="text-sm text-gray-600">
                          {report.billingModel}
                        </p>
                      </div>
                    </div>

                    {report.aiAssessmentDescription && (
                      <div
                        className={cn(
                          "border rounded-lg p-3 mb-4",
                          report.aiStatus === "Green"
                            ? "bg-green-50 border-green-200"
                            : report.aiStatus === "Amber"
                            ? "bg-yellow-50 border-yellow-200"
                            : report.aiStatus === "Red"
                            ? "bg-red-50 border-red-200"
                            : "bg-gray-50 border-gray-200"
                        )}
                      >
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          AI Assessment
                        </p>
                        <p className="text-sm text-gray-700">
                          {report.aiAssessmentDescription}
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        Current Week Update
                      </p>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {report.updateForCurrentWeek}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* View Report Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Weekly Status Report Details</DialogTitle>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    Project
                  </label>
                  <p className="text-sm text-gray-700">
                    {selectedReport.project?.name}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    Reporting Date
                  </label>
                  <p className="text-sm text-gray-700">
                    {formatDate(selectedReport.reportingDate)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    Health Status
                  </label>
                  <Badge
                    className={cn(
                      "border",
                      getRagStatusStyles(
                        selectedReport.healthCurrentWeek || "Green"
                      )
                    )}
                  >
                    {selectedReport.healthCurrentWeek || "Green"}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    Client Escalation
                  </label>
                  <p className="text-sm text-gray-700">
                    {selectedReport.clientEscalation || "None"}
                  </p>
                </div>
              </div>

              {selectedReport.aiAssessmentDescription && (
                <div
                  className={cn(
                    "border rounded-lg p-4",
                    selectedReport.aiStatus === "Green"
                      ? "bg-green-50 border-green-200"
                      : selectedReport.aiStatus === "Amber"
                      ? "bg-yellow-50 border-yellow-200"
                      : selectedReport.aiStatus === "Red"
                      ? "bg-red-50 border-red-200"
                      : "bg-gray-50 border-gray-200"
                  )}
                >
                  <label className="text-sm font-medium text-gray-900">
                    AI Assessment
                  </label>
                  <p className="text-sm text-gray-700 mt-1">
                    {selectedReport.aiAssessmentDescription}
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-900">
                  Current Week Update
                </label>
                <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                  {selectedReport.updateForCurrentWeek}
                </p>
              </div>

              {selectedReport.planForNextWeek && (
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    Plan for Next Week
                  </label>
                  <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                    {selectedReport.planForNextWeek}
                  </p>
                </div>
              )}

              {selectedReport.issuesChallenges && (
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    Issues & Challenges
                  </label>
                  <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                    {selectedReport.issuesChallenges}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}