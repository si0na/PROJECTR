import { useState } from "react";
import { useLocation } from "wouter";
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
  AlertTriangle,
  CheckCircle,
  ArrowUpDown,
  RefreshCw,
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
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProjectForm } from "@/components/forms/project-form";
import { useAuth } from "@/hooks/use-auth";
import { USER_ROLES } from "@/lib/constants";
import type { ExternalProject } from "@shared/schema";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

function ExternalProjectCard({ project }: { project: ExternalProject }) {
  const [, setLocation] = useLocation();
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);

  // New state for bulk updates
  const [bulkUpdates, setBulkUpdates] = useState<Array<{
    reportingDate: string;
    llmAiStatus: string;
    weeklyUpdateColumn: string;
    keyWeeklyUpdates: string;
    deliveryModel?: string;
    clientEscalation?: boolean;
    planForNextWeek?: string;
    currentSdlcPhase?: string;
    issuesChallenges?: string;
  }>>([{
    reportingDate: new Date().toISOString().split('T')[0],
    llmAiStatus: '',
    weeklyUpdateColumn: '',
    keyWeeklyUpdates: '',
    deliveryModel: '',
    clientEscalation: false,
    planForNextWeek: '',
    currentSdlcPhase: '',
    issuesChallenges: ''
  }]);

  // Get the latest status
  const latestStatus = project.projectStatuses?.length > 0
    ? [...project.projectStatuses].sort((a, b) => 
        new Date(b.reportingDate).getTime() - new Date(a.reportingDate).getTime()
      )[0]
    : null;

  // Status color mapping
  const statusColors = {
    Red: 'bg-red-100 text-red-800 border-red-200',
    Amber: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Green: 'bg-green-100 text-green-800 border-green-200',
    default: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  const getStatusColor = (status?: string | null) => {
    if (!status) return statusColors.default;
    return statusColors[status as keyof typeof statusColors] || statusColors.default;
  };

  // Importance color mapping
  const importanceColors = {
    High: 'bg-purple-100 text-purple-800 border-purple-200',
    Medium: 'bg-blue-100 text-blue-800 border-blue-200',
    Low: 'bg-gray-100 text-gray-800 border-gray-200',
    default: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  const getImportanceColor = (importance?: string | null) => {
    if (!importance) return importanceColors.default;
    return importanceColors[importance as keyof typeof importanceColors] || importanceColors.default;
  };

  // Truncate long text
  const truncateText = (text: string, maxLength: number = 100) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const addBulkUpdateEntry = () => {
    setBulkUpdates([...bulkUpdates, {
      reportingDate: new Date().toISOString().split('T')[0],
      llmAiStatus: '',
      weeklyUpdateColumn: '',
      keyWeeklyUpdates: '',
      deliveryModel: '',
      clientEscalation: false,
      planForNextWeek: '',
      currentSdlcPhase: '',
      issuesChallenges: ''
    }]);
  };

  const removeBulkUpdateEntry = (index: number) => {
    const newUpdates = [...bulkUpdates];
    newUpdates.splice(index, 1);
    setBulkUpdates(newUpdates);
  };

  const handleBulkUpdateFieldChange = (index: number, field: string, value: string | boolean) => {
    const newUpdates = [...bulkUpdates];
    newUpdates[index] = {
      ...newUpdates[index],
      [field]: value
    };
    setBulkUpdates(newUpdates);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <div>
            <CardTitle className="text-lg font-bold line-clamp-2">
              {project.projectName}
            </CardTitle>
            <CardDescription className="flex items-center mt-1 text-sm">
              <Building className="h-4 w-4 mr-1.5 flex-shrink-0" />
              {project.account}
            </CardDescription>
          </div>
          <div className="flex gap-2 items-center">
            {latestStatus?.llmAiStatus && (
              <Badge className={`${getStatusColor(latestStatus.llmAiStatus)} font-medium`}>
                {latestStatus.llmAiStatus}
              </Badge>
            )}
            {project.importance && (
              <Badge className={`${getImportanceColor(project.importance)} text-xs`}>
                {project.importance}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-grow space-y-4">
        {/* AI Assessment at the top */}
        {latestStatus?.llmAiAssessmentDescription ? (
          <div className={`p-3 rounded-lg border ${getStatusColor(latestStatus.llmAiStatus)}`}>
            <div className="flex items-start">
              {latestStatus.llmAiStatus === 'Red' ? (
                <AlertTriangle className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0 text-red-600" />
              ) : (
                <CheckCircle className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0 text-green-600" />
              )}
              <div>
                <p className="text-sm font-medium mb-1">AI Assessment</p>
                <p className="text-sm">{truncateText(latestStatus.llmAiAssessmentDescription)}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
            <div className="flex items-center text-gray-500">
              <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
              <p className="text-sm">No AI assessment available</p>
            </div>
          </div>
        )}

        {/* Project details section */}
        <div className="space-y-3">
          <div className="flex items-start">
            <UserIcon className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">
                PM: <span className="font-bold text-gray-900">{project.projectManagerName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <Calendar className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">
                Delivery Model: <span className="font-bold text-gray-900">
                  {latestStatus?.deliveryModel || project.billingModel || 'N/A'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <AlertTriangle className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0 text-red-600" />
            <div>
              <p className="text-sm text-gray-600">
                Escalation: <span className={`font-bold ${latestStatus?.clientEscalation ? 'text-red-600' : 'text-green-600'}`}>
                  {latestStatus ? (latestStatus.clientEscalation ? 'Yes' : 'No') : 'No data'}
                </span>
              </p>
              {latestStatus?.clientEscalationDetails && (
                <p className="text-xs text-gray-500 mt-1">
                  {truncateText(latestStatus.clientEscalationDetails, 80)}
                </p>
              )}
            </div>
          </div>

          {/* Concise latest update section */}
          {latestStatus && (
            <div className="flex items-start pt-2">
              <div className="flex-shrink-0">
                <Calendar className="h-4 w-4 mt-0.5 mr-2 text-blue-600" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {latestStatus.currentSdlcPhase && (
                    <Badge variant="outline" className="text-xs">
                      {latestStatus.currentSdlcPhase}
                    </Badge>
                  )}
                  {latestStatus.weeklyUpdateColumn && (
                    <span className="text-sm font-medium text-gray-600">
                      {latestStatus.weeklyUpdateColumn}
                    </span>
                  )}
                </div>
                {latestStatus.reportingDate && (
                  <p className="text-xs text-gray-500">
                    Updated: {new Date(latestStatus.reportingDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between pt-4">
        <Button 
          variant="outline"
          onClick={() => setShowBulkUpdateModal(true)}
        >
          Bulk Update
        </Button>
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => setLocation(`/projects/${project.projectId}`)}
        >
          View Details
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </CardFooter>

      {/* Bulk Update Modal */}
      <Dialog open={showBulkUpdateModal} onOpenChange={setShowBulkUpdateModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Status Updates for {project.projectName}</DialogTitle>
            <DialogDescription>
              Add multiple status updates at once
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-6">
              {bulkUpdates.map((update, index) => (
                <div key={index} className="border rounded-lg p-4 relative">
                  {bulkUpdates.length > 1 && (
                    <button 
                      onClick={() => removeBulkUpdateEntry(index)}
                      className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                  <h3 className="font-medium mb-3">Update {index + 1}</h3>
                  
                  <Tabs defaultValue="basic">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="basic">Basic Info</TabsTrigger>
                      <TabsTrigger value="updates">Updates</TabsTrigger>
                      <TabsTrigger value="details">Details</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="basic">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Reporting Date</label>
                          <Input 
                            type="date" 
                            value={update.reportingDate}
                            onChange={(e) => handleBulkUpdateFieldChange(index, 'reportingDate', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">RAG Status</label>
                          <Select
                            value={update.llmAiStatus}
                            onValueChange={(value) => handleBulkUpdateFieldChange(index, 'llmAiStatus', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Green">Green</SelectItem>
                              <SelectItem value="Amber">Amber</SelectItem>
                              <SelectItem value="Red">Red</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Delivery Model</label>
                          <Input 
                            placeholder="Enter delivery model"
                            value={update.deliveryModel || ''}
                            onChange={(e) => handleBulkUpdateFieldChange(index, 'deliveryModel', e.target.value)}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            id={`clientEscalation-${index}`}
                            checked={update.clientEscalation || false}
                            onChange={(e) => handleBulkUpdateFieldChange(index, 'clientEscalation', e.target.checked)}
                          />
                          <label htmlFor={`clientEscalation-${index}`} className="text-sm font-medium">
                            Client Escalation
                          </label>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="updates">
                      <div className="space-y-4 mt-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Weekly Update Column</label>
                          <Input 
                            placeholder="Enter weekly update column"
                            value={update.weeklyUpdateColumn || ''}
                            onChange={(e) => handleBulkUpdateFieldChange(index, 'weeklyUpdateColumn', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Key Weekly Updates</label>
                          <Input 
                            placeholder="Enter key updates for this week"
                            value={update.keyWeeklyUpdates || ''}
                            onChange={(e) => handleBulkUpdateFieldChange(index, 'keyWeeklyUpdates', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Plan for Next Week</label>
                          <Input 
                            placeholder="Enter plan for next week"
                            value={update.planForNextWeek || ''}
                            onChange={(e) => handleBulkUpdateFieldChange(index, 'planForNextWeek', e.target.value)}
                          />
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="details">
                      <div className="space-y-4 mt-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Current SDLC Phase</label>
                          <Input 
                            placeholder="Enter current SDLC phase"
                            value={update.currentSdlcPhase || ''}
                            onChange={(e) => handleBulkUpdateFieldChange(index, 'currentSdlcPhase', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Issues/Challenges</label>
                          <Input 
                            placeholder="Enter current issues or challenges"
                            value={update.issuesChallenges || ''}
                            onChange={(e) => handleBulkUpdateFieldChange(index, 'issuesChallenges', e.target.value)}
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              ))}
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={addBulkUpdateEntry}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Update
              </Button>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowBulkUpdateModal(false);
                    setBulkUpdates([{
                      reportingDate: new Date().toISOString().split('T')[0],
                      llmAiStatus: '',
                      weeklyUpdateColumn: '',
                      keyWeeklyUpdates: '',
                      deliveryModel: '',
                      clientEscalation: false,
                      planForNextWeek: '',
                      currentSdlcPhase: '',
                      issuesChallenges: ''
                    }]);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    // Handle bulk update submission here
                    console.log('Submitting bulk updates:', bulkUpdates);
                    setShowBulkUpdateModal(false);
                  }}
                >
                  Save All Updates
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default function Projects() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [importanceFilter, setImportanceFilter] = useState<string>("all");
  const [managerFilter, setManagerFilter] = useState<string>("all");
  const [escalationFilter, setEscalationFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("projectName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: projects, isLoading: projectsLoading } = useQuery<ExternalProject[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await fetch("http://34.63.198.88/api/projects/");
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      return response.json();
    }
  });

  const filteredProjects = projects?.filter((project) => {
    // Search filter
    if (
      searchTerm &&
      !project.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !project.account?.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !project.projectCodeId?.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }

    // Get latest status
    const latestStatus = project.projectStatuses?.length > 0
      ? [...project.projectStatuses].sort((a, b) => 
          new Date(b.reportingDate).getTime() - new Date(a.reportingDate).getTime()
        )[0]
      : null;

    // Status filter
    if (
      statusFilter !== "all" &&
      latestStatus?.llmAiStatus?.toLowerCase() !== statusFilter
    ) {
      return false;
    }

    // Importance filter
    if (
      importanceFilter !== "all" &&
      project.importance?.toLowerCase() !== importanceFilter
    ) {
      return false;
    }

    // Manager filter
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

  // Sort projects with custom ordering for status and importance
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    // Define the custom order for status and importance
    const statusOrder = { 'Red': 0, 'Amber': 1, 'Green': 2, '': 3 };
    const importanceOrder = { 'High': 0, 'Medium': 1, 'Low': 2, '': 3 };

    let valueA: any, valueB: any;

    if (sortField === "status") {
      const latestStatusA = a.projectStatuses?.length > 0
        ? [...a.projectStatuses].sort((a, b) => 
            new Date(b.reportingDate).getTime() - new Date(a.reportingDate).getTime()
          )[0]
        : null;
      const latestStatusB = b.projectStatuses?.length > 0
        ? [...b.projectStatuses].sort((a, b) => 
            new Date(b.reportingDate).getTime() - new Date(a.reportingDate).getTime()
          )[0]
        : null;
      
      valueA = latestStatusA?.llmAiStatus || "";
      valueB = latestStatusB?.llmAiStatus || "";
      
      // Use the custom status order for comparison
      valueA = statusOrder[valueA as keyof typeof statusOrder] ?? 3;
      valueB = statusOrder[valueB as keyof typeof statusOrder] ?? 3;
    } else if (sortField === "importance") {
      valueA = a.importance || "";
      valueB = b.importance || "";
      
      // Use the custom importance order for comparison
      valueA = importanceOrder[valueA as keyof typeof importanceOrder] ?? 3;
      valueB = importanceOrder[valueB as keyof typeof importanceOrder] ?? 3;
    } else if (sortField === "manager") {
      valueA = a.projectManagerName || "";
      valueB = b.projectManagerName || "";
    } else {
      // Default sort by project name
      valueA = a.projectName || "";
      valueB = b.projectName || "";
    }

    if (valueA < valueB) {
      return sortDirection === "asc" ? -1 : 1;
    }
    if (valueA > valueB) {
      return sortDirection === "asc" ? 1 : -1;
    }
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedProjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProjects = sortedProjects.slice(startIndex, endIndex);

  // Get unique PM names from data with proper typing
  const pmNames = Array.from(
    new Set(
      projects?.map(p => p.projectManagerName).filter((name): name is string => Boolean(name))
    )
  ).sort((a: string, b: string) => a.localeCompare(b));

  const canCreateProjects = user?.role === USER_ROLES.DELIVERY_MANAGER || user?.role === USER_ROLES.ADMIN;

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  };

  const handleSortChange = (field: string) => {
    if (sortField === field) {
      toggleSortDirection();
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleGenerateAssessment = () => {
    // TODO: Implement assessment generation logic
    console.log('Generating new assessment for all projects');
  };

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
                <Button
                  onClick={handleGenerateAssessment}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generate Assessment
                </Button>
                <Dialog open={createProjectOpen} onOpenChange={setCreateProjectOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Project
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                    <ProjectForm
                      onSuccess={() => setCreateProjectOpen(false)}
                      onCancel={() => setCreateProjectOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Filters and Sorting */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search projects by name or account..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

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
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={statusFilter === "green"}
                          onChange={() =>
                            setStatusFilter(statusFilter === "green" ? "all" : "green")
                          }
                          className="h-4 w-4"
                        />
                        Green
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={statusFilter === "amber"}
                          onChange={() =>
                            setStatusFilter(statusFilter === "amber" ? "all" : "amber")
                          }
                          className="h-4 w-4"
                        />
                        Amber
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={statusFilter === "red"}
                          onChange={() =>
                            setStatusFilter(statusFilter === "red" ? "all" : "red")
                          }
                          className="h-4 w-4"
                        />
                        Red
                      </label>
                    </div>

                    <label className="block font-medium mb-1">Priority</label>
                    <div className="flex flex-col gap-1 mb-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={importanceFilter === "high"}
                          onChange={() =>
                            setImportanceFilter(importanceFilter === "high" ? "all" : "high")
                          }
                          className="h-4 w-4"
                        />
                        High
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={importanceFilter === "medium"}
                          onChange={() =>
                            setImportanceFilter(importanceFilter === "medium" ? "all" : "medium")
                          }
                          className="h-4 w-4"
                        />
                        Medium
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={importanceFilter === "low"}
                          onChange={() =>
                            setImportanceFilter(importanceFilter === "low" ? "all" : "low")
                          }
                          className="h-4 w-4"
                        />
                        Low
                      </label>
                    </div>

                    <label className="block font-medium mb-1">PM</label>
                    <div className="flex flex-col gap-1 mb-2 max-h-40 overflow-y-auto">
                      {pmNames.map((pm: string) => (
                        <label key={pm} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={managerFilter === pm}
                            onChange={() =>
                              setManagerFilter(managerFilter === pm ? "all" : pm)
                            }
                            className="h-4 w-4"
                          />
                          {pm}
                        </label>
                      ))}
                    </div>
                  </div>
                </SelectContent>
              </Select>

              {/* Sort Dropdown */}
              <Select
                value={sortField}
                onValueChange={(value) => handleSortChange(value)}
              >
                <SelectTrigger className="w-40">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="projectName">
                    {sortField === "projectName" && sortDirection === "asc" ? "↑ " : ""}
                    {sortField === "projectName" && sortDirection === "desc" ? "↓ " : ""}
                    Project Name
                  </SelectItem>
                  <SelectItem value="status">
                    {sortField === "status" && sortDirection === "asc" ? "↑ " : ""}
                    {sortField === "status" && sortDirection === "desc" ? "↓ " : ""}
                    Status
                  </SelectItem>
                  <SelectItem value="importance">
                    {sortField === "importance" && sortDirection === "asc" ? "↑ " : ""}
                    {sortField === "importance" && sortDirection === "desc" ? "↓ " : ""}
                    Importance
                  </SelectItem>
                  <SelectItem value="manager">
                    {sortField === "manager" && sortDirection === "asc" ? "↑ " : ""}
                    {sortField === "manager" && sortDirection === "desc" ? "↓ " : ""}
                    Project Manager
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {projectsLoading ? (
          <div className="flex justify-center items-center h-64">
            <p>Loading projects...</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-600">
                Showing {startIndex + 1}-{Math.min(endIndex, sortedProjects.length)} of {sortedProjects.length} projects
              </p>
              {(searchTerm || statusFilter !== "all" || importanceFilter !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setImportanceFilter("all");
                    setManagerFilter("all");
                    setEscalationFilter("all");
                    setCurrentPage(1);
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>

            {sortedProjects.length === 0 ? (
              <div className="bg-white rounded-lg border border-dashed border-gray-200 p-12 text-center">
                <div className="mx-auto max-w-md">
                  <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No projects found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Try adjusting your search or filter criteria
                  </p>
                  <div className="mt-6">
                    <Button onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                      setImportanceFilter("all");
                      setManagerFilter("all");
                      setEscalationFilter("all");
                    }}>
                      Clear all filters
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {currentProjects.map((project) => (
                    <ExternalProjectCard 
                      key={project.projectId} 
                      project={project}
                    />
                  ))}
                </div>

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
                        .filter((page) => page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2))
                        .map((page, index, array) => (
                          <div key={page} className="flex items-center">
                            {index > 0 && page - array[index - 1] > 1 && (
                              <span className="px-2 text-gray-400">...</span>
                            )}
                            <Button
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="min-w-[2.5rem]"
                            >
                              {page}
                            </Button>
                          </div>
                        ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}