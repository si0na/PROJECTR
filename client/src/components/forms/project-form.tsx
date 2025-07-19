import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarIcon, Plus, X } from "lucide-react";
import { format } from "date-fns";
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
import { apiRequest } from "@/lib/queryClient";
import { insertProjectSchema } from "@shared/schema";
import { PROJECT_IMPORTANCE, DELIVERY_MODELS, RAG_STATUS } from "@/lib/constants";
import type { User } from "@shared/schema";
import { cn } from "@/lib/utils";

const projectFormSchema = insertProjectSchema.extend({
  startDate: z.date(),
  plannedEndDate: z.date(),
  projectTags: z.array(z.string()).optional(),
  slaKpiMetrics: z.string().optional(),
  documentationUrl: z.string().url().optional().or(z.literal("")),
  teamSquad: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectFormSchema>;

const engagementTypes = [
  "Development",
  "Maintenance", 
  "Support",
  "Consulting",
  "Migration",
  "Enhancement"
];

interface ProjectFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProjectForm({ onSuccess, onCancel }: ProjectFormProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      codeId: "",
      customer: "",
      engagementType: "",
      deliveryModel: "Fixed Price",
      projectImportance: "Medium",
      ragStatus: "Green",
      scopeDescription: "",
      projectManagerId: undefined,
      deliveryManagerId: undefined,
      teamSquad: "",
      startDate: new Date(),
      plannedEndDate: new Date(),
      clientEscalation: false,
      isActive: true,
      aiMonitoringEnabled: true,
      projectTags: [],
      slaKpiMetrics: "",
      documentationUrl: "",
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      const { startDate, plannedEndDate, projectTags, ...projectData } = data;
      
      const requestData = {
        ...projectData,
        startDate: startDate.toISOString(),
        plannedEndDate: plannedEndDate.toISOString(),
        projectTags: tags,
      };

      // External API doesn't support creating projects - this would need backend implementation
      throw new Error("Project creation not supported with external API");

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects/external"] });
      toast({
        title: "Success",
        description: "Project created successfully",
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
    createProjectMutation.mutate({ ...data, projectTags: tags });
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const projectManagers = users?.filter(user => user.role === 'project_manager') || [];
  const deliveryManagers = users?.filter(user => user.role === 'delivery_manager') || [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Project Details Section */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Project Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Customer Portal Migration" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="codeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Code *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., CPM-2025-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., TechCorp Industries" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="engagementType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Engagement Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select engagement type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {engagementTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
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
              name="deliveryModel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Model *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select delivery model" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(DELIVERY_MODELS).map(([key, value]) => (
                        <SelectItem key={key} value={value}>
                          {value}
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
              name="projectImportance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(PROJECT_IMPORTANCE).map(([key, value]) => (
                        <SelectItem key={key} value={value}>
                          {value}
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
              name="ragStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial RAG Status *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select RAG status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(RAG_STATUS).map(([key, value]) => (
                        <SelectItem key={key} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="scopeDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Scope Description *</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe the project scope, objectives, and key deliverables..."
                    className="min-h-[100px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Stakeholders Section */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Stakeholders
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="projectManagerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Manager *</FormLabel>
                  <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project manager" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projectManagers.map((manager) => (
                        <SelectItem key={manager.id} value={manager.id.toString()}>
                          {manager.username} ({manager.email})
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
              name="deliveryManagerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Manager</FormLabel>
                  <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select delivery manager" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {deliveryManagers.map((manager) => (
                        <SelectItem key={manager.id} value={manager.id.toString()}>
                          {manager.username} ({manager.email})
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
              name="teamSquad"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team / Squad</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Alpha Squad, Platform Team" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Timeline Section */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Timeline
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date *</FormLabel>
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
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date("1900-01-01")
                        }
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
              name="plannedEndDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Planned End Date *</FormLabel>
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
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Status & Flags Section */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Status & Flags
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="clientEscalation"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Is Escalated?</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Mark if client has escalated issues
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

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
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

            <FormField
              control={form.control}
              name="aiMonitoringEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">AI Monitoring</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Enable AI-powered monitoring
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
        </div>

        {/* Optional Section */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Optional Details
          </h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="project-tags">Project Tags</Label>
              <div className="flex space-x-2 mt-2">
                <Input
                  id="project-tags"
                  placeholder="Add tag and press Enter"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button type="button" onClick={addTag} variant="outline" size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="slaKpiMetrics"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SLA/KPI Metrics</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Define SLA commitments and KPI targets..."
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="documentationUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Documentation URL</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://docs.company.com/project-name"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={createProjectMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {createProjectMutation.isPending ? "Creating..." : "Create Project"}
          </Button>
        </div>
      </form>
    </Form>
  );
}