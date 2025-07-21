import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarIcon, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { format, isSameWeek, startOfWeek, addDays } from "date-fns";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const projectFormSchema = z.object({
  projectName: z.string().min(1, "Project name is required"),
  projectCodeId: z.string().optional(),
  projectManagerName: z.string().min(1, "Project manager is required"),
  account: z.string().min(1, "Account is required"),
  billingModel: z.string().min(1, "Billing model is required"),
  tower: z.string().min(1, "Tower is required"),
  fte: z.string().min(1, "FTE is required"),
  wsrPublisYesNo: z.string(),
  importance: z.string().min(1, "Importance is required"),
  isActive: z.boolean(),
  projectStatuses: z.array(
    z.object({
      reportingDate: z.date().refine(date => {
        // Ensure date is Monday (start of week)
        return date.getDay() === 1;
      }, {
        message: "Reporting date must be a Monday"
      }),
      projectImportance: z.string(),
      deliveryModel: z.string(),
      clientEscalation: z.boolean(),
      clientEscalationDetails: z.string().optional(),
      ragStatus: z.string(),
      keyWeeklyUpdates: z.string(),
      weeklyUpdateColumn: z.string(),
      planForNextWeek: z.string(),
      issuesChallenges: z.string(),
      planForGreen: z.string(),
      currentSdlcPhase: z.string(),
      sqaRemarks: z.string(),
    })
  ).refine(statuses => {
    // Check for duplicate weeks
    const weeks = statuses.map(status => 
      format(status.reportingDate, 'yyyy-ww')
    );
    return new Set(weeks).size === weeks.length;
  }, {
    message: "Only one status update allowed per week",
    path: ["projectStatuses"]
  })
});

type ProjectFormData = z.infer<typeof projectFormSchema>;

const billingModels = ["Time and Material", "Fixed Price", "Hybrid", "Retainer", "Fixed Bid"];
const towers = ["Data & Analytics", "Cloud", "Digital", "Security", "Infrastructure", "Tower 1", "Tower 2"];
const importanceLevels = ["Low", "Medium", "High", "Critical"];
const ragStatuses = ["Green", "Amber", "Red"];
const sdlcPhases = ["Planning", "Analysis", "Design", "Development", "Testing", "Deployment", "Maintenance"];
const deliveryModels = ["Agile", "Waterfall", "Hybrid"];

interface ProjectFormProps {
  initialData?: Partial<ProjectFormData>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProjectForm({ initialData, onSuccess, onCancel }: ProjectFormProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [editingStatusIndex, setEditingStatusIndex] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: initialData || {
      projectName: "",
      projectCodeId: "",
      projectManagerName: "",
      account: "",
      billingModel: "Time and Material",
      tower: "Data & Analytics",
      fte: "1.0",
      wsrPublisYesNo: "Y",
      importance: "Medium",
      isActive: true,
      projectStatuses: [{
        reportingDate: startOfWeek(new Date(), { weekStartsOn: 1 }), // Always Monday
        projectImportance: "Medium",
        deliveryModel: "Hybrid",
        clientEscalation: false,
        clientEscalationDetails: "",
        ragStatus: "Green",
        keyWeeklyUpdates: "",
        weeklyUpdateColumn: "",
        planForNextWeek: "",
        issuesChallenges: "",
        planForGreen: "",
        currentSdlcPhase: "Development",
        sqaRemarks: ""
      }]
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      // Prepare the data for API
      const apiData = {
        ...data,
        projectStatuses: data.projectStatuses.map(status => ({
          ...status,
          reportingDate: format(status.reportingDate, 'yyyy-MM-dd'),
          clientEscalation: status.clientEscalation ? 1 : 0
        }))
      };

      const response = await fetch('http://34.63.198.88:8080/api/projects/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save project');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "Success",
        description: "Project saved successfully",
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProjectFormData) => {
    createProjectMutation.mutate(data);
  };

  const addStatus = () => {
    const newStatus = {
      reportingDate: startOfWeek(new Date(), { weekStartsOn: 1 }), // Always Monday
      projectImportance: form.getValues("importance"),
      deliveryModel: form.getValues("billingModel"),
      clientEscalation: false,
      clientEscalationDetails: "",
      ragStatus: "Green",
      keyWeeklyUpdates: "",
      weeklyUpdateColumn: "",
      planForNextWeek: "",
      issuesChallenges: "",
      planForGreen: "",
      currentSdlcPhase: "Development",
      sqaRemarks: ""
    };
    
    form.setValue("projectStatuses", [...form.getValues("projectStatuses"), newStatus]);
    setEditingStatusIndex(form.getValues("projectStatuses").length - 1);
    setActiveStep(1);
  };

  const editStatus = (index: number) => {
    setEditingStatusIndex(index);
    setActiveStep(1);
  };

  const deleteStatus = (index: number) => {
    const statuses = form.getValues("projectStatuses");
    if (statuses.length <= 1) {
      toast({
        title: "Error",
        description: "At least one status is required",
        variant: "destructive",
      });
      return;
    }
    
    const newStatuses = statuses.filter((_, i) => i !== index);
    form.setValue("projectStatuses", newStatuses);
    
    if (editingStatusIndex === index) {
      setEditingStatusIndex(null);
    }
  };

  const nextStep = () => {
    setActiveStep(1);
  };

  const prevStep = () => {
    setActiveStep(0);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Project Details Section */}
        {activeStep === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900">
                {initialData ? "Edit Project" : "Create New Project"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="projectName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Customer Analytics Platform" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="projectCodeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Code</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., CAP-2025-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="projectManagerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Manager *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Srinivasan K R" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="account"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., DataInsights Corp" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="billingModel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billing Model *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select billing model" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {billingModels.map((model) => (
                            <SelectItem key={model} value={model}>
                              {model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tower"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tower *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select tower" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {towers.map((tower) => (
                            <SelectItem key={tower} value={tower}>
                              {tower}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fte"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>FTE *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="e.g., 8.0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="wsrPublisYesNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Publish WSR?</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select option" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Y">Yes</SelectItem>
                          <SelectItem value="N">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="importance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Importance *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select importance level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {importanceLevels.map((level) => (
                            <SelectItem key={level} value={level}>
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 md:col-span-2">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active Project</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Enable for active projects
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button type="button" onClick={nextStep} className="bg-blue-600 hover:bg-blue-700">
                  Next: Weekly Status <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Updates Section */}
        {activeStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Weekly Status Updates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Project: {form.watch("projectName") || "Untitled Project"}</h3>
                  <p className="text-sm text-muted-foreground">
                    Add weekly status updates for this project
                  </p>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addStatus}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" /> Add Weekly Status
                </Button>
              </div>

              {/* Status List */}
              <div className="space-y-4">
                {form.getValues("projectStatuses").map((status, index) => (
                  <Card 
                    key={index} 
                    className={`${editingStatusIndex === index ? 'border-blue-500' : ''}`}
                  >
                    <CardHeader className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">
                            Week of {format(status.reportingDate, "MMM d, yyyy")}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {format(status.reportingDate, "MMMM yyyy")}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            onClick={() => editStatus(index)}
                          >
                            {editingStatusIndex === index ? "Editing" : "Edit"}
                          </Button>
                          {form.getValues("projectStatuses").length > 1 && (
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm" 
                              onClick={() => deleteStatus(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    {editingStatusIndex === index ? (
                      <CardContent className="p-4 pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <FormField
                            control={form.control}
                            name={`projectStatuses.${index}.reportingDate`}
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>Week Date *</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant="outline"
                                        className={cn(
                                          "w-full pl-3 text-left font-normal",
                                          !field.value && "text-muted-foreground"
                                        )}
                                      >
                                        {field.value ? (
                                          format(field.value, "PPP")
                                        ) : (
                                          <span>Pick a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={field.value}
                                      onSelect={(date) => {
                                        // Always set to Monday
                                        const monday = startOfWeek(date || new Date(), { weekStartsOn: 1 });
                                        field.onChange(monday);
                                      }}
                                      disabled={(date) => date > new Date()}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`projectStatuses.${index}.projectImportance`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Project Importance *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select importance level" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {importanceLevels.map((level) => (
                                      <SelectItem key={level} value={level}>
                                        {level}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`projectStatuses.${index}.deliveryModel`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Delivery Model *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select delivery model" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {deliveryModels.map((model) => (
                                      <SelectItem key={model} value={model}>
                                        {model}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`projectStatuses.${index}.ragStatus`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>RAG Status *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select RAG status" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {ragStatuses.map((status) => (
                                      <SelectItem key={status} value={status}>
                                        {status}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`projectStatuses.${index}.currentSdlcPhase`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>SDLC Phase *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select SDLC phase" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {sdlcPhases.map((phase) => (
                                      <SelectItem key={phase} value={phase}>
                                        {phase}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`projectStatuses.${index}.clientEscalation`}
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Client Escalation?</FormLabel>
                                  <div className="text-sm text-muted-foreground">
                                    Is there a client escalation this week?
                                  </div>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          {form.watch(`projectStatuses.${index}.clientEscalation`) && (
                            <FormField
                              control={form.control}
                              name={`projectStatuses.${index}.clientEscalationDetails`}
                              render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                  <FormLabel>Escalation Details</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Describe the escalation details..."
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}

                          <FormField
                            control={form.control}
                            name={`projectStatuses.${index}.weeklyUpdateColumn`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Week Identifier *</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="e.g., Week 28 - 60% completion" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`projectStatuses.${index}.keyWeeklyUpdates`}
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel>Key Updates *</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Summarize key updates for this week..."
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`projectStatuses.${index}.issuesChallenges`}
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel>Issues & Challenges *</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Describe current issues and challenges..."
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`projectStatuses.${index}.planForNextWeek`}
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel>Plan for Next Week *</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Outline the plan for next week..."
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`projectStatuses.${index}.planForGreen`}
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel>Plan to Achieve Green</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Describe the plan to achieve green status..."
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`projectStatuses.${index}.sqaRemarks`}
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel>SQA Remarks</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Enter SQA remarks..."
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    ) : (
                      <CardContent className="p-4 pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          <div>
                            <Label className="text-sm text-muted-foreground">RAG Status</Label>
                            <div className="mt-1">
                              <Badge variant={status.ragStatus.toLowerCase() as any}>
                                {status.ragStatus}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Importance</Label>
                            <p className="mt-1 text-sm">{status.projectImportance}</p>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Delivery Model</Label>
                            <p className="mt-1 text-sm">{status.deliveryModel}</p>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">SDLC Phase</Label>
                            <p className="mt-1 text-sm">{status.currentSdlcPhase}</p>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Week</Label>
                            <p className="mt-1 text-sm">{status.weeklyUpdateColumn || "-"}</p>
                          </div>
                          <div className="md:col-span-3">
                            <Label className="text-sm text-muted-foreground">Key Updates</Label>
                            <p className="mt-1 text-sm whitespace-pre-line">
                              {status.keyWeeklyUpdates || "No updates provided"}
                            </p>
                          </div>
                          {status.clientEscalation && (
                            <div className="md:col-span-3">
                              <Label className="text-sm text-muted-foreground">Escalation</Label>
                              <p className="mt-1 text-sm text-red-600 whitespace-pre-line">
                                {status.clientEscalationDetails || "Details not provided"}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>

              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ChevronLeft className="mr-2 h-4 w-4" /> Back to Project Details
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createProjectMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {createProjectMutation.isPending ? "Saving..." : "Save Project"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </Form>
  );
}