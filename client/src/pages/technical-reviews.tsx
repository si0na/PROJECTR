import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Calendar,
  User as UserIcon,
  Download,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
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
import { TechnicalReviewForm } from "@/components/forms/technical-review-form";
import type { TechnicalReview, Project, User } from "@shared/schema";
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

interface EnrichedTechnicalReview extends TechnicalReview {
  project?: Project;
  conductor?: User;
}

export default function TechnicalReviews() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] =
    useState<EnrichedTechnicalReview | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedPMs, setSelectedPMs] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: reviews, isLoading: reviewsLoading } = useQuery<
    EnrichedTechnicalReview[]
  >({
    queryKey: ["/api/technical-reviews"],
  });

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects/external"],
  });

  const reviewTypes = [
    "Code Review",
    "Architecture Review",
    "Security Review",
    "Performance Review",
    "Deployment Review",
  ];

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

  const filteredReviews =
    reviews?.filter((review) => {
      // Search filter
      if (
        searchTerm &&
        !review.project?.name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) &&
        !review.executiveSummary
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Type filter
      if (
        typeFilter !== "all" &&
        review.reviewType?.toLowerCase() !== typeFilter.toLowerCase()
      ) {
        return false;
      }

      // Project filter
      if (
        projectFilter !== "all" &&
        review.projectId.toString() !== projectFilter
      ) {
        return false;
      }

      // PM filter
      if (
        selectedPMs.length > 0 &&
        !selectedPMs.includes(review.conductor?.name || "")
      ) {
        return false;
      }

      return true;
    }) || [];

  const sortedReviews = filteredReviews.sort(
    (a, b) =>
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
  );

  const handleViewReview = (review: EnrichedTechnicalReview) => {
    setSelectedReview(review);
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
    const dataToExport = allData ? reviews : filteredReviews;
    if (!dataToExport || dataToExport.length === 0) return;

    const exportData = dataToExport.map((review) => ({
      "Project Name": review.project?.name || "",
      "Review Type": review.reviewType || "",
      "Cycle Number": review.reviewCycleNumber || "",
      "Review Date": review.reviewDate ? formatDate(review.reviewDate) : "",
      "Conducted By": review.conductor?.name || "",
      "Executive Summary": review.executiveSummary || "",
      "Architecture Review": review.architectureDesignReview || "",
      "Code Quality Standards": review.codeQualityStandards || "",
      "DevOps & Deployment": review.devopsDeploymentReadiness || "",
      "Testing & QA": review.testingQa || "",
      "Risk Identification": review.riskIdentification || "",
      "Action Items": review.actionItemsRecommendations || "",
      "Reviewer Sign-off": review.reviewerSignOff || "",
      "SQA Validation": review.sqaValidation || "",
      "Participants": review.participants?.join(", ") || "",
      "Created At": formatDate(new Date(review.createdAt!)),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Technical Reviews");

    const fileName = `technical-reviews-${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const exportToCSV = (allData: boolean = false) => {
    const dataToExport = allData ? reviews : filteredReviews;
    if (!dataToExport || dataToExport.length === 0) return;

    const exportData = dataToExport.map((review) => ({
      "Project Name": review.project?.name || "",
      "Review Type": review.reviewType || "",
      "Cycle Number": review.reviewCycleNumber || "",
      "Review Date": review.reviewDate ? formatDate(review.reviewDate) : "",
      "Conducted By": review.conductor?.name || "",
      "Executive Summary": review.executiveSummary || "",
      "Architecture Review": review.architectureDesignReview || "",
      "Code Quality Standards": review.codeQualityStandards || "",
      "DevOps & Deployment": review.devopsDeploymentReadiness || "",
      "Testing & QA": review.testingQa || "",
      "Risk Identification": review.riskIdentification || "",
      "Action Items": review.actionItemsRecommendations || "",
      "Reviewer Sign-off": review.reviewerSignOff || "",
      "SQA Validation": review.sqaValidation || "",
      "Participants": review.participants?.join(", ") || "",
      "Created At": formatDate(new Date(review.createdAt!)),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const csv = XLSX.utils.sheet_to_csv(worksheet);

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `technical-reviews-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const togglePM = (pm: string) => {
    setSelectedPMs((prev) =>
      prev.includes(pm) ? prev.filter((p) => p !== pm) : [...prev, pm]
    );
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setProjectFilter("all");
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
                Technical Reviews
              </h1>
              <p className="text-gray-600 mt-1">
                Manage technical review reports and documentation
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

              <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Review
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Technical Review</DialogTitle>
                  </DialogHeader>
                  <TechnicalReviewForm
                    onSuccess={() => setReviewModalOpen(false)}
                    onCancel={() => setReviewModalOpen(false)}
                  />
                </DialogContent>
              </Dialog>
              {/* Upload Technical Report Button with Dialog */}
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
                    Upload Technical Report
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Upload Technical Review Document</DialogTitle>
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
                  placeholder="Search reviews by project or content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Review Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {reviewTypes.map((type) => (
                    <SelectItem key={type} value={type.toLowerCase()}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
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

                  {selectedPMs.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
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

        {/* Reviews List */}
        {reviewsLoading ? (
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
        ) : sortedReviews.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-500">
              <h3 className="text-lg font-medium mb-2">No reviews found</h3>
              <p>
                {searchTerm ||
                typeFilter !== "all" ||
                projectFilter !== "all" ||
                selectedPMs.length > 0
                  ? "Try adjusting your filters to see more reviews."
                  : "Get started by creating your first technical review."}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Results Summary */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-600">
                Showing {sortedReviews.length} of {reviews?.length || 0} reviews
              </p>

              {(searchTerm ||
                typeFilter !== "all" ||
                projectFilter !== "all" ||
                selectedPMs.length > 0) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                >
                  Clear Filters
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {sortedReviews.map((review) => (
                <Card
                  key={review.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          {review.project?.name || "Unknown Project"} -{" "}
                          {review.reviewType}
                        </CardTitle>
                        <div className="flex items-center space-x-4 mt-2">
                          <Badge variant="outline">
                            Cycle {review.reviewCycleNumber}
                          </Badge>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(review.reviewDate)}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <UserIcon className="h-4 w-4 mr-1" />
                            {review.conductor?.name || "Unknown"}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewReview(review)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {review.executiveSummary && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          Executive Summary
                        </p>
                        <p className="text-sm text-gray-700 line-clamp-3">
                          {review.executiveSummary}
                        </p>
                      </div>
                    )}

                    {review.participants && review.participants.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          Participants
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {review.participants
                            .slice(0, 3)
                            .map((participant, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="text-xs"
                              >
                                {participant}
                              </Badge>
                            ))}
                          {review.participants.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{review.participants.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* View Review Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Technical Review Details</DialogTitle>
          </DialogHeader>

          {selectedReview ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    Project
                  </label>
                  <p className="text-sm text-gray-700">
                    {selectedReview.project?.name ?? ""}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    Review Date
                  </label>
                  <p className="text-sm text-gray-700">
                    {selectedReview.reviewDate
                      ? formatDate(selectedReview.reviewDate)
                      : ""}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    Review Type
                  </label>
                  <p className="text-sm text-gray-700">
                    {selectedReview.reviewType ?? ""}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    Cycle Number
                  </label>
                  <p className="text-sm text-gray-700">
                    {selectedReview.reviewCycleNumber ?? ""}
                  </p>
                </div>
              </div>

              {Array.isArray(selectedReview.participants) &&
                selectedReview.participants.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-900">
                      Participants
                    </label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedReview.participants.map((participant, index) => (
                        <Badge key={index} variant="secondary">
                          {participant}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

              {selectedReview.executiveSummary && (
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    Executive Summary
                  </label>
                  <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                    {selectedReview.executiveSummary}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedReview.architectureDesignReview && (
                  <div>
                    <label className="text-sm font-medium text-gray-900">
                      Architecture & Design Review
                    </label>
                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                      {selectedReview.architectureDesignReview}
                    </p>
                  </div>
                )}

                {selectedReview.codeQualityStandards && (
                  <div>
                    <label className="text-sm font-medium text-gray-900">
                      Code Quality Standards
                    </label>
                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                      {selectedReview.codeQualityStandards}
                    </p>
                  </div>
                )}

                {selectedReview.devopsDeploymentReadiness && (
                  <div>
                    <label className="text-sm font-medium text-gray-900">
                      DevOps & Deployment Readiness
                    </label>
                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                      {selectedReview.devopsDeploymentReadiness}
                    </p>
                  </div>
                )}

                {selectedReview.testingQa && (
                  <div>
                    <label className="text-sm font-medium text-gray-900">
                      Testing & QA
                    </label>
                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                      {selectedReview.testingQa}
                    </p>
                  </div>
                )}
              </div>

              {selectedReview.riskIdentification && (
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    Risk Identification
                  </label>
                  <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                    {selectedReview.riskIdentification}
                  </p>
                </div>
              )}

              {selectedReview.actionItemsRecommendations && (
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    Action Items & Recommendations
                  </label>
                  <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                    {selectedReview.actionItemsRecommendations}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedReview.reviewerSignOff && (
                  <div>
                    <label className="text-sm font-medium text-gray-900">
                      Reviewer Sign-off
                    </label>
                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                      {selectedReview.reviewerSignOff}
                    </p>
                  </div>
                )}

                {selectedReview.sqaValidation && (
                  <div>
                    <label className="text-sm font-medium text-gray-900">
                      SQA Validation
                    </label>
                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                      {selectedReview.sqaValidation}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}