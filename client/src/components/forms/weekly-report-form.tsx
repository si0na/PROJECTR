import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";

// Define schema based on your API response
const weeklyReportFormSchema = z.object({
  projectId: z.number().min(1, "Please select a project"),
  reportingDate: z.string().refine(val => !isNaN(new Date(val).getTime()), {
    message: "Please select a valid date"
  }),
  projectImportance: z.enum(["High", "Medium", "Low", "Critical"]),
  deliveryModel: z.enum(["Agile", "Scrum", "Kanban", "Waterfall", "Hybrid"]),
  healthCurrentWeek: z.enum(["Green", "Amber", "Red"]),
  clientEscalation: z.boolean(),
  clientEscalationDetails: z.string().optional(),
  keyWeeklyUpdates: z.string().min(1, "Key updates are required"),
  weeklyUpdateColumn: z.string().optional(),
  planForNextWeek: z.string().optional(),
  issuesChallenges: z.string().optional(),
  planForGreen: z.string().optional(),
  currentSdlcPhase: z.string().optional(),
  sqaRemarks: z.string().optional()
});

type WeeklyReportFormValues = z.infer<typeof weeklyReportFormSchema>;

interface WeeklyReportFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: Partial<WeeklyReportFormValues>;
}

export function WeeklyReportForm({ onSuccess, onCancel, initialData }: WeeklyReportFormProps) {
  const [showEscalationDetails, setShowEscalationDetails] = useState(
    initialData?.clientEscalation || false
  );
  const { toast } = useToast();
  const queryClient = useQueryClient();
const { data: projects, isLoading: projectsLoading } = useQuery({
  queryKey: ['/api/projects/external'],
  select: (data: Array<{ 
    projectId: number; 
    isActive: boolean;
    // Add other properties you need
  }>) => data?.filter(project => project.isActive) || []
});

  const form = useForm<WeeklyReportFormValues>({
    resolver: zodResolver(weeklyReportFormSchema),
    defaultValues: {
      projectId: initialData?.projectId || 0,
      reportingDate: initialData?.reportingDate || new Date().toISOString().split('T')[0],
      projectImportance: initialData?.projectImportance || "Medium",
      deliveryModel: initialData?.deliveryModel || "Agile",
      healthCurrentWeek: initialData?.healthCurrentWeek || "Green",
      clientEscalation: initialData?.clientEscalation || false,
      clientEscalationDetails: initialData?.clientEscalationDetails || "",
      keyWeeklyUpdates: initialData?.keyWeeklyUpdates || "",
      weeklyUpdateColumn: initialData?.weeklyUpdateColumn || "",
      planForNextWeek: initialData?.planForNextWeek || "",
      issuesChallenges: initialData?.issuesChallenges || "",
      planForGreen: initialData?.planForGreen || "",
      currentSdlcPhase: initialData?.currentSdlcPhase || "",
      sqaRemarks: initialData?.sqaRemarks || ""
    }
  });

  const createReportMutation = useMutation({
    mutationFn: async (data: WeeklyReportFormValues) => {
      const reportData = {
        ...data,
        reportingDate: new Date(data.reportingDate).toISOString(),
        clientEscalation: data.clientEscalation ? 1 : 0
      };
      return apiRequest('POST', '/api/weekly-reports', reportData);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Weekly report submitted successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/weekly-reports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/trends'] });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit weekly report",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: WeeklyReportFormValues) => {
    createReportMutation.mutate(data);
  };

  const handleEscalationChange = (checked: boolean) => {
    setShowEscalationDetails(checked);
    form.setValue('clientEscalation', checked);
    if (!checked) form.setValue('clientEscalationDetails', "");
  };

  if (projectsLoading) return <div className="p-4">Loading projects...</div>;
  if (!projects?.length) return <div className="p-4">No active projects available</div>;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Project Selection */}
          <FormField
            control={form.control}
            name="projectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(Number(value))}
                  value={field.value.toString()}
                  disabled={!!initialData}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {projects.map((project: any) => (
                      <SelectItem 
                        key={project.projectId} 
                        value={project.projectId.toString()}
                      >
                        {project.projectName} ({project.account})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Reporting Date */}
          <FormField
            control={form.control}
            name="reportingDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Reporting Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className="w-full pl-3 text-left font-normal"
                      >
                        {field.value ? (
                          format(new Date(field.value), "PPP")
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
                      selected={new Date(field.value)}
                      onSelect={(date) => 
                        date && field.onChange(date.toISOString().split('T')[0])
                      }
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Project Importance */}
          <FormField
            control={form.control}
            name="projectImportance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Importance</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Critical">Critical</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Delivery Model */}
          <FormField
            control={form.control}
            name="deliveryModel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Delivery Model</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Agile">Agile</SelectItem>
                    <SelectItem value="Scrum">Scrum</SelectItem>
                    <SelectItem value="Kanban">Kanban</SelectItem>
                    <SelectItem value="Waterfall">Waterfall</SelectItem>
                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Health Status */}
          <FormField
            control={form.control}
            name="healthCurrentWeek"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Health Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Green">Green</SelectItem>
                    <SelectItem value="Amber">Amber</SelectItem>
                    <SelectItem value="Red">Red</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Client Escalation */}
          <FormField
            control={form.control}
            name="clientEscalation"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={handleEscalationChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Client Escalation</FormLabel>
                </div>
              </FormItem>
            )}
          />

          {/* Escalation Details (conditionally shown) */}
          {showEscalationDetails && (
            <FormField
              control={form.control}
              name="clientEscalationDetails"
              render={({ field }) => (
                <FormItem>
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

          {/* Key Weekly Updates */}
          <FormField
            control={form.control}
            name="keyWeeklyUpdates"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Key Weekly Updates</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="What was accomplished this week?"
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Weekly Update Column */}
          <FormField
            control={form.control}
            name="weeklyUpdateColumn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weekly Update Summary</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Brief summary of weekly updates"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Plan for Next Week */}
          <FormField
            control={form.control}
            name="planForNextWeek"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plan for Next Week</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="What are the plans for next week?"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Issues/Challenges */}
          <FormField
            control={form.control}
            name="issuesChallenges"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Issues/Challenges</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Any current issues or challenges?"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Plan to Achieve Green */}
          {form.watch("healthCurrentWeek") !== "Green" && (
            <FormField
              control={form.control}
              name="planForGreen"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan to Achieve Green Status</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Action plan to return to Green status"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Current SDLC Phase */}
          <FormField
            control={form.control}
            name="currentSdlcPhase"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current SDLC Phase</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select phase" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Requirements">Requirements</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Development">Development</SelectItem>
                    <SelectItem value="Testing">Testing</SelectItem>
                    <SelectItem value="Deployment">Deployment</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* SQA Remarks */}
          <FormField
            control={form.control}
            name="sqaRemarks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SQA Remarks</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Any SQA observations or remarks"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4 pt-6">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={createReportMutation.isPending}>
            {createReportMutation.isPending ? "Submitting..." : "Submit Report"}
          </Button>
        </div>
      </form>
    </Form>
  );
}