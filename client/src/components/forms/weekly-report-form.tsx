import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { insertWeeklyStatusReportSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { PROJECT_IMPORTANCE, DELIVERY_MODELS, RAG_STATUS } from "@/lib/constants";
import type { Project } from "@shared/schema";

const weeklyReportFormSchema = insertWeeklyStatusReportSchema.extend({
  reportingDate: z.string().min(1, "Reporting date is required"),
});

type WeeklyReportFormData = z.infer<typeof weeklyReportFormSchema>;

interface WeeklyReportFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function WeeklyReportForm({ onSuccess, onCancel }: WeeklyReportFormProps) {
  const [showEscalationDetails, setShowEscalationDetails] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects/external'],
  });

  const form = useForm<WeeklyReportFormData>({
    resolver: zodResolver(weeklyReportFormSchema),
    defaultValues: {
      projectId: 0,
      reportingDate: new Date().toISOString().split('T')[0],
      projectImportance: PROJECT_IMPORTANCE.MEDIUM,
      deliveryModel: DELIVERY_MODELS.AGILE,
      clientEscalation: false,
      clientEscalationDetails: "",
      ragStatus: RAG_STATUS.GREEN,
      keyWeeklyUpdates: "",
      weeklyUpdateColumn: "",
    },
  });

  const createReportMutation = useMutation({
    mutationFn: async (data: WeeklyReportFormData) => {
      const reportData = {
        ...data,
        reportingDate: new Date(data.reportingDate),
      };
      return apiRequest('POST', '/api/weekly-reports', reportData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Weekly report submitted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/weekly-reports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/trends'] });
      form.reset();
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit weekly report",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: WeeklyReportFormData) => {
    createReportMutation.mutate(data);
  };

  const handleEscalationChange = (checked: boolean) => {
    setShowEscalationDetails(checked);
    form.setValue('clientEscalation', checked);
    if (!checked) {
      form.setValue('clientEscalationDetails', '');
    }
  };

  if (projectsLoading) {
    return <div className="p-6">Loading projects...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="projectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Name</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  value={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Project" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {projects?.map((project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name}
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
            name="reportingDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reporting Week</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="projectImportance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Importance</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={PROJECT_IMPORTANCE.HIGH}>High</SelectItem>
                    <SelectItem value={PROJECT_IMPORTANCE.MEDIUM}>Medium</SelectItem>
                    <SelectItem value={PROJECT_IMPORTANCE.LOW}>Low</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="deliveryModel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Delivery Model</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={DELIVERY_MODELS.AGILE}>Agile</SelectItem>
                    <SelectItem value={DELIVERY_MODELS.SCRUM}>Scrum</SelectItem>
                    <SelectItem value={DELIVERY_MODELS.KANBAN}>Kanban</SelectItem>
                    <SelectItem value={DELIVERY_MODELS.WATERFALL}>Waterfall</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="clientEscalation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client Escalations</FormLabel>
              <FormControl>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={handleEscalationChange}
                  />
                  <label className="text-sm font-medium">
                    Yes, there is a client escalation
                  </label>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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

        <FormField
          control={form.control}
          name="keyWeeklyUpdates"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Key Weekly Updates</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Provide a brief summary of key updates for this week..."
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="weeklyUpdateColumn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Updates (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Any additional updates or notes..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={createReportMutation.isPending}
          >
            {createReportMutation.isPending ? "Submitting..." : "Submit Report"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
