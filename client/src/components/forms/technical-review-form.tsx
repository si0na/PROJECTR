import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { insertTechnicalReviewSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { Project } from "@shared/schema";

const technicalReviewFormSchema = insertTechnicalReviewSchema.extend({
  reviewDate: z.string().min(1, "Review date is required"),
  participants: z.string().min(1, "At least one participant is required"),
});

type CustomFieldType =
  | "checkbox"
  | "slider"
  | "textarea"
  | "number"
  | "text"
  | "select";
interface CustomField {
  label: string;
  type: CustomFieldType;
  value: any;
}

type TechnicalReviewFormDataWithCustom = z.infer<
  typeof technicalReviewFormSchema
> & {
  customFields: CustomField[];
};

interface TechnicalReviewFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TechnicalReviewForm({
  onSuccess,
  onCancel,
}: TechnicalReviewFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects/external"],
  });

  const form = useForm<TechnicalReviewFormDataWithCustom>({
    resolver: zodResolver(technicalReviewFormSchema),
    defaultValues: {
      projectId: 0,
      reviewDate: new Date().toISOString().split("T")[0],
      reviewType: "Code Review",
      reviewCycleNumber: 1,
      executiveSummary: "",
      architectureDesignReview: "",
      codeQualityStandards: "",
      devopsDeploymentReadiness: "",
      testingQa: "",
      riskIdentification: "",
      complianceStandards: "",
      actionItemsRecommendations: "",
      reviewerSignOff: "",
      sqaValidation: "",
      participants: "",
      customFields: [],
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: async (data: TechnicalReviewFormDataWithCustom) => {
      const reviewData = {
        ...data,
        reviewDate: new Date(data.reviewDate),
        participants: data.participants.split(",").map((p: string) => p.trim()),
      };
      return apiRequest("POST", "/api/technical-reviews", reviewData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Technical review submitted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/technical-reviews"] });
      form.reset();
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit technical review",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TechnicalReviewFormDataWithCustom) => {
    createReviewMutation.mutate(data);
  };

  // Dynamic custom fields logic
  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "customFields",
  });

  if (projectsLoading) {
    return <div className="p-6">Loading projects...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Custom Review Parameters Section */}
        <div className="bg-gray-50 border rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">Custom Review Parameters</span>
            <Button
              type="button"
              size="sm"
              onClick={() =>
                append({ label: "", type: "checkbox", value: false })
              }
            >
              Add Parameter
            </Button>
          </div>
          {fields.length === 0 && (
            <div className="text-gray-400 text-sm">
              No custom parameters added.
            </div>
          )}
          <div className="space-y-3">
            {fields.map((field, idx) => (
              <div key={field.id} className="flex items-center gap-2">
                {/* Parameter Name */}
                <Input
                  className="w-1/3"
                  placeholder="Parameter name"
                  value={field.label}
                  onChange={(e) =>
                    update(idx, { ...field, label: e.target.value })
                  }
                />
                {/* Parameter Type Dropdown */}
                <Select
                  value={field.type}
                  onValueChange={(value) => {
                    let defaultValue: any = "";
                    if (value === "checkbox") defaultValue = false;
                    if (value === "slider") defaultValue = 0;
                    if (value === "textarea") defaultValue = "";
                    if (value === "number") defaultValue = 0;
                    if (value === "text") defaultValue = "";
                    if (value === "select") defaultValue = "";
                    update(idx, {
                      ...field,
                      type: value as CustomFieldType,
                      value: defaultValue,
                    });
                  }}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checkbox">Checkbox</SelectItem>
                    <SelectItem value="slider">Slider (0-10)</SelectItem>
                    <SelectItem value="textarea">Textarea</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="select">Select (Dropdown)</SelectItem>
                  </SelectContent>
                </Select>
                {/* Render input based on type */}
                {field.type === "checkbox" && (
                  <input
                    type="checkbox"
                    checked={!!field.value}
                    onChange={(e) =>
                      update(idx, { ...field, value: e.target.checked })
                    }
                  />
                )}
                {field.type === "slider" && (
                  <input
                    type="range"
                    min={0}
                    max={10}
                    value={field.value}
                    onChange={(e) =>
                      update(idx, { ...field, value: Number(e.target.value) })
                    }
                  />
                )}
                {field.type === "textarea" && (
                  <Textarea
                    className="w-1/2"
                    rows={2}
                    value={field.value}
                    onChange={(e) =>
                      update(idx, { ...field, value: e.target.value })
                    }
                  />
                )}
                {field.type === "number" && (
                  <Input
                    type="number"
                    className="w-24"
                    value={field.value}
                    onChange={(e) =>
                      update(idx, { ...field, value: Number(e.target.value) })
                    }
                  />
                )}
                {field.type === "text" && (
                  <Input
                    type="text"
                    className="w-1/2"
                    value={field.value}
                    onChange={(e) =>
                      update(idx, { ...field, value: e.target.value })
                    }
                  />
                )}
                {field.type === "select" && (
                  <Input
                    type="text"
                    className="w-1/2"
                    placeholder="Comma-separated options (e.g. Yes,No,N/A)"
                    value={
                      Array.isArray(field.value)
                        ? field.value.join(",")
                        : field.value
                    }
                    onChange={(e) =>
                      update(idx, {
                        ...field,
                        value: e.target.value.split(","),
                      })
                    }
                  />
                )}
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => remove(idx)}
                  aria-label="Delete parameter"
                >
                  ✕
                </Button>
              </div>
            ))}
          </div>
        </div>
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
                      <SelectItem
                        key={project.id}
                        value={project.id.toString()}
                      >
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
            name="reviewDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Review Date</FormLabel>
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
            name="reviewType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Review Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Code Review">Code Review</SelectItem>
                    <SelectItem value="Architecture Review">
                      Architecture Review
                    </SelectItem>
                    <SelectItem value="Security Review">
                      Security Review
                    </SelectItem>
                    <SelectItem value="Performance Review">
                      Performance Review
                    </SelectItem>
                    <SelectItem value="Deployment Review">
                      Deployment Review
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="reviewCycleNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Review Cycle Number</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="participants"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Participants (comma-separated)</FormLabel>
              <FormControl>
                <Input
                  placeholder="John Doe, Jane Smith, Tech Lead..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="executiveSummary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Executive Summary</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="High-level summary of the technical review..."
                  rows={3}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="architectureDesignReview"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Architecture & Design Review</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Architecture and design assessment..."
                    rows={4}
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="codeQualityStandards"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code Quality Standards</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Code quality assessment..."
                    rows={4}
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="devopsDeploymentReadiness"
            render={({ field }) => (
              <FormItem>
                <FormLabel>DevOps & Deployment Readiness</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="DevOps and deployment assessment..."
                    rows={4}
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="testingQa"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Testing & QA</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Testing and QA assessment..."
                    rows={4}
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="riskIdentification"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Risk Identification</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Identified risks and concerns..."
                  rows={3}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="actionItemsRecommendations"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Action Items & Recommendations</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Action items and recommendations..."
                  rows={4}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="reviewerSignOff"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reviewer Sign-off</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Reviewer sign-off and approval..."
                    rows={3}
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sqaValidation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SQA Validation</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="SQA validation notes..."
                    rows={3}
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={createReviewMutation.isPending}>
            {createReviewMutation.isPending ? "Submitting..." : "Submit Review"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
