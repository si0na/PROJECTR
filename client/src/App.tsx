import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { AIAssessmentHeader } from "@/components/dashboard/ai-assessment-header";
import { AnalyticsOverview } from "@/components/dashboard/analytics-overview";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Projects from "@/pages/projects";
import WeeklyReports from "@/pages/weekly-reports";
import TechnicalReviews from "@/pages/technical-reviews";
import LlmConfig from "@/pages/llm-config";
import Analytics from "@/pages/analytics";
import { StagewiseToolbar } from '@stagewise/toolbar-react';
import ReactPlugin from '@stagewise-plugins/react';
import ProjectDetailsPage from "@/pages/projects/[id]";

function AppContent() {
  const { user, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // User selection state for Navbar and dashboard
  const [selectedPerson, setSelectedPerson] = useState<{ name: string; value: string; level: string } | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 max-w-md w-full mx-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
            <p className="text-gray-600">Please log in to access the Samiksha dashboard.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Navbar
        onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        selectedPerson={selectedPerson}
        setSelectedPerson={setSelectedPerson}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isOpen={sidebarOpen}
          isCollapsed={sidebarCollapsed}
          onClose={() => setSidebarOpen(false)}
          toggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <main className="flex-1 overflow-auto">
          <Switch>
            <Route path="/">
              <Dashboard
                selectedPerson={selectedPerson}
                setSelectedPerson={setSelectedPerson}
              />
            </Route>
            <Route path="/projects" component={Projects} />
            <Route path="/projects/:id" component={ProjectDetailsPage} />
            <Route path="/weekly-reports" component={WeeklyReports} />
            <Route path="/technical-reviews" component={TechnicalReviews} />
            <Route path="/analytics" component={Analytics} />
            <Route path="/llm-config" component={LlmConfig} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {import.meta.env.DEV && (
          <StagewiseToolbar config={{ plugins: [ReactPlugin] }} />
        )}
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;