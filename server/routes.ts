import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertProjectSchema, 
  insertWeeklyStatusReportSchema, 
  insertTechnicalReviewSchema, 
  insertLlmConfigurationSchema 
} from "@shared/schema";
import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    role: string;
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication middleware
  const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    req.user = { id: 1, role: 'admin' };
    next();
  };

  const requireRole = (roles: string[]) => (
    req: AuthenticatedRequest, 
    res: Response, 
    next: NextFunction
  ) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };

  // Helper function for error handling
  const handleError = (res: Response, error: unknown, context: string) => {
    console.error(`Error in ${context}:`, error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: `Invalid ${context} data`, 
        errors: error.errors 
      });
    }
    if (error instanceof Error) {
      return res.status(500).json({ 
        message: `Failed to ${context}`, 
        error: error.message 
      });
    }
    res.status(500).json({ 
      message: `Unknown error occurred during ${context}` 
    });
  };

  // Current user endpoint
  app.get('/api/users/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) throw new Error("User not authenticated");
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      handleError(res, error, 'fetch user');
    }
  });

  app.get('/api/users', requireAuth, async (req: Request, res: Response) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      handleError(res, error, 'fetch users');
    }
  });

  // Proxy endpoint for external API
  app.get('/api/projects', requireAuth, async (req: Request, res: Response) => {
    try {
      console.log('Proxying request to external API...');
      const response = await fetch('http://34.63.198.88/api/projects/');
      
      if (!response.ok) {
        throw new Error(`External API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`External API returned ${Array.isArray(data) ? data.length : 'non-array'} data`);
      res.json(data);
    } catch (error) {
      handleError(res, error, 'fetch projects from external API');
    }
  });

  // Weekly Status Reports endpoints
  app.get('/api/weekly-reports', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      const reports = await storage.getWeeklyStatusReports(projectId);
      
      const enrichedReports = await Promise.all(
        reports.map(async (report) => {
          const project = await storage.getProject(report.projectId);
          const submittedBy = report.submittedBy ? await storage.getUser(report.submittedBy) : null;
          return { ...report, project, submittedBy };
        })
      );
      
      res.json(enrichedReports);
    } catch (error) {
      handleError(res, error, 'fetch weekly reports');
    }
  });

  app.post('/api/weekly-reports', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) throw new Error("User not authenticated");
      const reportData = insertWeeklyStatusReportSchema.parse(req.body);
      const reportWithUser = { ...reportData, submittedBy: req.user.id };
      
      const report = await storage.createWeeklyStatusReport(reportWithUser);
      res.status(201).json(report);
    } catch (error) {
      handleError(res, error, 'create weekly report');
    }
  });

  // Technical Reviews endpoints
  app.get('/api/technical-reviews', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      const reviews = await storage.getTechnicalReviews(projectId);
      
      const enrichedReviews = await Promise.all(
        reviews.map(async (review) => {
          const project = await storage.getProject(review.projectId);
          const conductor = review.conductedBy ? await storage.getUser(review.conductedBy) : null;
          return { ...review, project, conductor };
        })
      );
      
      res.json(enrichedReviews);
    } catch (error) {
      handleError(res, error, 'fetch technical reviews');
    }
  });

  app.post('/api/technical-reviews', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) throw new Error("User not authenticated");
      const reviewData = insertTechnicalReviewSchema.parse(req.body);
      const reviewWithUser = { ...reviewData, conductedBy: req.user.id };
      
      const review = await storage.createTechnicalReview(reviewWithUser);
      res.status(201).json(review);
    } catch (error) {
      handleError(res, error, 'create technical review');
    }
  });

  // LLM Configuration endpoints
  app.get('/api/llm-config', requireAuth, requireRole(['delivery_manager', 'admin']), 
    async (req: Request, res: Response) => {
      try {
        const config = await storage.getActiveLlmConfiguration();
        res.json(config);
      } catch (error) {
        handleError(res, error, 'fetch LLM configuration');
      }
    }
  );

  app.post('/api/llm-config', requireAuth, requireRole(['delivery_manager', 'admin']), 
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        if (!req.user) throw new Error("User not authenticated");
        const configData = insertLlmConfigurationSchema.parse(req.body);
        const configWithUser = { ...configData, lastUpdatedBy: req.user.id };
        
        const existing = await storage.getLlmConfigurations();
        await Promise.all(
          existing.map(config => 
            storage.updateLlmConfiguration(config.id, { isActive: false })
          )
        );
        
        const config = await storage.createLlmConfiguration(configWithUser);
        res.status(201).json(config);
      } catch (error) {
        handleError(res, error, 'create LLM configuration');
      }
    }
  );

  // Portfolio Analysis endpoints
  app.get('/api/portfolio-analysis', requireAuth, async (req: Request, res: Response) => {
    try {
      const analysis = await storage.getLatestPortfolioAnalysis();
      res.json(analysis);
    } catch (error) {
      handleError(res, error, 'fetch portfolio analysis');
    }
  });

  // Dashboard stats endpoint
  app.get('/api/dashboard/stats', requireAuth, async (req: Request, res: Response) => {
    try {
      const reports = await storage.getWeeklyStatusReports();
      
      const latestReports = new Map<number, any>();
      reports.forEach(report => {
        if (!latestReports.has(report.projectId) || 
            report.createdAt! > latestReports.get(report.projectId).createdAt) {
          latestReports.set(report.projectId, report);
        }
      });

      const latestReportsArray = Array.from(latestReports.values());
      
      const stats = {
        greenProjects: latestReportsArray.filter(r => r.ragStatus === 'Green').length,
        amberProjects: latestReportsArray.filter(r => r.ragStatus === 'Amber').length,
        redProjects: latestReportsArray.filter(r => r.ragStatus === 'Red').length,
        escalations: latestReportsArray.filter(r => r.clientEscalation).length,
        totalProjects: latestReportsArray.length
      };
      
      res.json(stats);
    } catch (error) {
      handleError(res, error, 'fetch dashboard stats');
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}