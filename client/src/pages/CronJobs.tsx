import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Clock, Send, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const cronJobs = [
  {
    id: 1,
    name: "Twitter Use Case Search",
    schedule: "Every 24 hours",
    lastRun: "2 hours ago",
    nextRun: "22 hours",
    status: "active",
    description: "Search Twitter for top use cases and market trends",
  },
  {
    id: 2,
    name: "Daily Report Generation",
    schedule: "Every 24 hours",
    lastRun: "1 day ago",
    nextRun: "1 hour",
    status: "active",
    description: "Generate comprehensive daily performance report",
  },
  {
    id: 3,
    name: "System Health Check",
    schedule: "Every 12 hours",
    lastRun: "6 hours ago",
    nextRun: "6 hours",
    status: "active",
    description: "Monitor system health and performance metrics",
  },
  {
    id: 4,
    name: "Data Backup",
    schedule: "Every 48 hours",
    lastRun: "1 day ago",
    nextRun: "1 day",
    status: "active",
    description: "Backup critical data and database records",
  },
];

const useCaseSuggestions = [
  {
    id: 1,
    title: "AI-Powered Customer Support Chatbot",
    source: "Twitter",
    relevance: 95,
    description: "Implement intelligent chatbot for customer support automation",
    businessApplicability:
      "Perfect for our customer service team to handle common inquiries",
  },
  {
    id: 2,
    title: "Predictive Analytics for Sales Forecasting",
    source: "Twitter",
    relevance: 87,
    description: "Use ML to predict sales trends and customer behavior",
    businessApplicability: "Highly applicable for sales strategy optimization",
  },
  {
    id: 3,
    title: "Automated Content Generation",
    source: "Twitter",
    relevance: 78,
    description: "Generate marketing content automatically from data",
    businessApplicability: "Good fit for our marketing automation needs",
  },
];

export default function CronJobs() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [selectedSuggestion, setSelectedSuggestion] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cron Jobs</h1>
          <p className="text-muted-foreground mt-1">
            Manage automated 24-hour tasks and scheduled operations
          </p>
        </div>

        {/* Scheduled Tasks */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Scheduled Tasks</h2>
          <div className="space-y-3">
            {cronJobs.map((job) => (
              <Card key={job.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{job.name}</h3>
                      <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">
                        ACTIVE
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{job.description}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Schedule: {job.schedule}</span>
                      </div>
                      <div>Last run: {job.lastRun}</div>
                      <div>Next run: {job.nextRun}</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Use Case Suggestions */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Use Case Suggestions from Twitter
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            AI-generated suggestions based on trending use cases. Deploy to Workshop to add to task queue.
          </p>

          <div className="space-y-4">
            {useCaseSuggestions.map((suggestion) => (
              <Card
                key={suggestion.id}
                className={`p-5 transition-all cursor-pointer ${
                  selectedSuggestion === suggestion.id
                    ? "ring-2 ring-primary border-primary"
                    : "hover:shadow-md"
                }`}
                onClick={() =>
                  setSelectedSuggestion(
                    selectedSuggestion === suggestion.id ? null : suggestion.id
                  )
                }
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">
                        {suggestion.title}
                      </h3>
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {suggestion.source}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {suggestion.description}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl font-bold text-primary">
                      {suggestion.relevance}%
                    </div>
                    <div className="text-xs text-muted-foreground">relevance</div>
                  </div>
                </div>

                {selectedSuggestion === suggestion.id && (
                  <div className="border-t border-border pt-4 space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-foreground mb-2">
                        Business Applicability
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {suggestion.businessApplicability}
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <Button className="flex-1">
                        <Send className="w-4 h-4 mr-2" />
                        Deploy to Workshop
                      </Button>
                      <Button variant="outline" className="flex-1">
                        Dismiss
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Execution History */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Recent Executions</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border-b border-border last:border-0">
              <div>
                <p className="font-medium text-foreground">Twitter Use Case Search</p>
                <p className="text-xs text-muted-foreground">Completed 2 hours ago</p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex items-center justify-between p-3 border-b border-border last:border-0">
              <div>
                <p className="font-medium text-foreground">Daily Report Generation</p>
                <p className="text-xs text-muted-foreground">Completed 1 day ago</p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex items-center justify-between p-3 border-b border-border last:border-0">
              <div>
                <p className="font-medium text-foreground">System Health Check</p>
                <p className="text-xs text-muted-foreground">Failed 3 days ago</p>
              </div>
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
