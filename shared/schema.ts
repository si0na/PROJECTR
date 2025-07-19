import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  role: text("role").notNull(), // 'project_manager', 'delivery_manager', 'admin'
  name: text("name").notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  codeId: text("code_id").notNull(),
  account: text("account").notNull(), // Customer/Client account name (e.g., CALX, New Era Cap)
  customer: text("customer").notNull(),
  engagementType: text("engagement_type").notNull(),
  deliveryModel: text("delivery_model").notNull(), // Managed, Staff Aug
  billingModel: text("billing_model").notNull(), // Fixed Bid, T&M, Capacity
  projectImportance: text("project_importance").notNull().default("Medium"), // Strategic, Critical, Standard
  ragStatus: text("rag_status").notNull().default("Green"),
  scopeDescription: text("scope_description").notNull(),
  projectManagerId: integer("project_manager_id").references(() => users.id),
  deliveryManagerId: integer("delivery_manager_id").references(() => users.id),
  teamSquad: text("team_squad"),
  tower: text("tower"), // Tower 1, Tower 2
  fte: text("fte"),
  revenue: text("revenue"),
  startDate: timestamp("start_date").notNull(),
  plannedEndDate: timestamp("planned_end_date").notNull(),
  clientEscalation: boolean("client_escalation").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  aiMonitoringEnabled: boolean("ai_monitoring_enabled").notNull().default(true),
  projectTags: text("project_tags").array(),
  slaKpiMetrics: text("sla_kpi_metrics"),
  documentationUrl: text("documentation_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const weeklyStatusReports = pgTable("weekly_status_reports", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  reportingDate: timestamp("reporting_date").notNull(),
  weekNumber: integer("week_number"),
  publishStatus: boolean("publish_status").default(false),
  healthPreviousWeek: text("health_previous_week"), // 'Red', 'Amber', 'Green'
  healthCurrentWeek: text("health_current_week").notNull(), // 'Red', 'Amber', 'Green'
  clientEscalation: text("client_escalation").default("None"),
  updateForCurrentWeek: text("update_for_current_week"),
  planForNextWeek: text("plan_for_next_week"),
  issuesChallenges: text("issues_challenges"),
  pathToGreen: text("path_to_green"),
  resourcingStatus: text("resourcing_status"),
  currentSdlcPhase: text("current_sdlc_phase"),
  sqaRemarks: text("sqa_remarks"),
  fte: text("fte"),
  revenue: text("revenue"),
  tower: text("tower"),
  billingModel: text("billing_model"),
  // LLM Analysis Results
  aiStatus: text("ai_status"), // 'Red', 'Amber', 'Green'
  aiAssessmentDescription: text("ai_assessment_description"),
  createdAt: timestamp("created_at").defaultNow(),
  submittedBy: integer("submitted_by").references(() => users.id),
});

export const technicalReviews = pgTable("technical_reviews", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  reviewDate: timestamp("review_date").notNull(),
  reviewType: text("review_type").notNull(),
  reviewCycleNumber: integer("review_cycle_number").notNull(),
  executiveSummary: text("executive_summary"),
  architectureDesignReview: text("architecture_design_review"),
  codeQualityStandards: text("code_quality_standards"),
  devopsDeploymentReadiness: text("devops_deployment_readiness"),
  testingQa: text("testing_qa"),
  riskIdentification: text("risk_identification"),
  complianceStandards: text("compliance_standards"),
  actionItemsRecommendations: text("action_items_recommendations"),
  reviewerSignOff: text("reviewer_sign_off"),
  sqaValidation: text("sqa_validation"),
  participants: text("participants").array(),
  conductedBy: integer("conducted_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const llmConfigurations = pgTable("llm_configurations", {
  id: serial("id").primaryKey(),
  providerName: text("provider_name").notNull(), // 'Google', 'OpenAI', 'DeepSeek'
  modelName: text("model_name").notNull(), // 'gemini-2.0-flash', 'gpt-4o'
  apiKey: text("api_key").notNull(),
  isActive: boolean("is_active").default(true),
  lastUpdatedBy: integer("last_updated_by").references(() => users.id),
  lastUpdatedDate: timestamp("last_updated_date").defaultNow(),
});

export const portfolioAnalysis = pgTable("portfolio_analysis", {
  id: serial("id").primaryKey(),
  analysisDate: timestamp("analysis_date").defaultNow(),
  overallPortfolioRagStatus: text("overall_portfolio_rag_status").notNull(), // 'Red', 'Amber', 'Green'
  reason: text("reason").notNull(),
  projectsAnalyzed: jsonb("projects_analyzed"), // Store the LLM response JSON
  columnsUsedForAnalysis: text("columns_used_for_analysis").array(),
  llmConfigurationId: integer("llm_configuration_id").references(() => llmConfigurations.id),
});

// External API Response Types for the new data structure
export const externalProjectSchema = z.object({
  projectId: z.number(),
  projectName: z.string(),
  projectCodeId: z.string().nullable(),
  projectManagerName: z.string(),
  account: z.string(),
  billingModel: z.string(),
  tower: z.string(),
  fte: z.string(),
  wsrPublisYesNo: z.string(),
  importance: z.string(),
  isActive: z.boolean(),
  projectReviews: z.array(z.any()),
  projectStatuses: z.array(z.object({
    statusId: z.string(),
    reportingDate: z.string(),
    projectImportance: z.string(),
    deliveryModel: z.string(),
    clientEscalation: z.boolean(),
    clientEscalationDetails: z.string().nullable(),
    ragStatus: z.string(),
    keyWeeklyUpdates: z.string(),
    weeklyUpdateColumn: z.string(),
    llmAiStatus: z.string().nullable(),
    llmAiAssessmentDescription: z.string().nullable(),
    planForNextWeek: z.string().nullable(),
    issuesChallenges: z.string().nullable(),
    planForGreen: z.string().nullable(),
    currentSdlcPhase: z.string().nullable(),
    sqaRemarks: z.string().nullable(),
  })),
});

export type ExternalProject = z.infer<typeof externalProjectSchema>;

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
});

export const insertWeeklyStatusReportSchema = createInsertSchema(weeklyStatusReports).omit({
  id: true,
  createdAt: true,
  aiStatus: true,
  aiAssessmentDescription: true,
});

export const insertTechnicalReviewSchema = createInsertSchema(technicalReviews).omit({
  id: true,
  createdAt: true,
});

export const insertLlmConfigurationSchema = createInsertSchema(llmConfigurations).omit({
  id: true,
  lastUpdatedDate: true,
});

export const insertPortfolioAnalysisSchema = createInsertSchema(portfolioAnalysis).omit({
  id: true,
  analysisDate: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type WeeklyStatusReport = typeof weeklyStatusReports.$inferSelect;
export type InsertWeeklyStatusReport = z.infer<typeof insertWeeklyStatusReportSchema>;

export type TechnicalReview = typeof technicalReviews.$inferSelect;
export type InsertTechnicalReview = z.infer<typeof insertTechnicalReviewSchema>;

export type LlmConfiguration = typeof llmConfigurations.$inferSelect;
export type InsertLlmConfiguration = z.infer<typeof insertLlmConfigurationSchema>;

export type PortfolioAnalysis = typeof portfolioAnalysis.$inferSelect;
export type InsertPortfolioAnalysis = z.infer<typeof insertPortfolioAnalysisSchema>;
