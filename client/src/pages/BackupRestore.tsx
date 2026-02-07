import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Download, Upload, RotateCcw, Trash2, Clock, Database, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const backups = [
  {
    id: 1,
    label: "Pre-Major Update",
    description: "Full backup before system upgrade",
    type: "manual",
    status: "completed",
    size: "245 MB",
    itemCount: 1247,
    createdAt: "2 hours ago",
    expiresAt: "30 days",
    includes: ["agents", "tasks", "documents", "metrics", "cronJobs", "useCases", "budgetAlerts"],
  },
  {
    id: 2,
    label: "Daily Backup - Feb 5",
    description: "Automatic daily backup",
    type: "automatic",
    status: "completed",
    size: "238 MB",
    itemCount: 1203,
    createdAt: "1 day ago",
    expiresAt: "29 days",
    includes: ["agents", "tasks", "documents", "metrics", "cronJobs", "useCases", "budgetAlerts"],
  },
  {
    id: 3,
    label: "Weekly Backup - Week 5",
    description: "Automatic weekly backup",
    type: "automatic",
    status: "completed",
    size: "225 MB",
    itemCount: 1156,
    createdAt: "3 days ago",
    expiresAt: "27 days",
    includes: ["agents", "tasks", "documents", "metrics", "cronJobs", "useCases", "budgetAlerts"],
  },
  {
    id: 4,
    label: "Post-Migration Backup",
    description: "Backup after system migration",
    type: "manual",
    status: "completed",
    size: "256 MB",
    itemCount: 1289,
    createdAt: "1 week ago",
    expiresAt: "23 days",
    includes: ["agents", "tasks", "documents", "metrics", "cronJobs", "useCases", "budgetAlerts"],
  },
];

const restoreHistory = [
  {
    id: 1,
    backupLabel: "Pre-Major Update",
    strategy: "merge",
    status: "completed",
    progress: 100,
    itemsProcessed: 1247,
    startedAt: "2 days ago",
    completedAt: "2 days ago",
    duration: "15 minutes",
  },
  {
    id: 2,
    backupLabel: "Weekly Backup - Week 4",
    strategy: "replace",
    status: "completed",
    progress: 100,
    itemsProcessed: 1156,
    startedAt: "1 week ago",
    completedAt: "1 week ago",
    duration: "22 minutes",
  },
];

function BackupCard({ backup }: { backup: (typeof backups)[0] }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground">{backup.label}</h3>
            <span className={`text-xs font-medium px-2 py-1 rounded ${
              backup.type === "manual"
                ? "bg-blue-50 text-blue-700"
                : "bg-green-50 text-green-700"
            }`}>
              {backup.type.toUpperCase()}
            </span>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-sm text-muted-foreground">{backup.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Size</p>
          <p className="font-medium text-foreground">{backup.size}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Items</p>
          <p className="font-medium text-foreground">{backup.itemCount}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Created</p>
          <p className="font-medium text-foreground">{backup.createdAt}</p>
        </div>
      </div>

      <div className="mb-4 p-3 bg-muted rounded-lg">
        <p className="text-xs text-muted-foreground mb-2">Includes</p>
        <div className="flex flex-wrap gap-1">
          {backup.includes.map((item) => (
            <span key={item} className="text-xs bg-background px-2 py-1 rounded">
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1">
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
        <Button size="sm" className="flex-1">
          <RotateCcw className="w-4 h-4 mr-2" />
          Restore
        </Button>
        <Button variant="ghost" size="sm">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        Expires in {backup.expiresAt}
      </p>
    </Card>
  );
}

export default function BackupRestore() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Backup & Restore</h1>
            <p className="text-muted-foreground mt-1">
              Manage system backups and disaster recovery
            </p>
          </div>
          <Button size="lg">
            <Database className="w-4 h-4 mr-2" />
            Create Backup Now
          </Button>
        </div>

        {/* Backup Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Backups</p>
                <p className="text-3xl font-bold text-foreground mt-2">4</p>
              </div>
              <Database className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
            <p className="text-xs text-muted-foreground mt-4">2 manual, 2 automatic</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Storage</p>
                <p className="text-3xl font-bold text-foreground mt-2">964 MB</p>
              </div>
              <Clock className="w-8 h-8 text-green-600 opacity-20" />
            </div>
            <p className="text-xs text-muted-foreground mt-4">Across all backups</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Backup</p>
                <p className="text-3xl font-bold text-foreground mt-2">2h ago</p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-600 opacity-20" />
            </div>
            <p className="text-xs text-muted-foreground mt-4">All systems healthy</p>
          </Card>
        </div>

        {/* Automatic Backup Schedule */}
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-foreground">Automatic Backup Schedule</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-lg border border-border">
              <p className="font-medium text-foreground mb-2">Daily Backup</p>
              <p className="text-sm text-muted-foreground mb-3">Every day at 2:00 AM</p>
              <p className="text-xs text-muted-foreground">Retention: 30 days</p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-border">
              <p className="font-medium text-foreground mb-2">Weekly Backup</p>
              <p className="text-sm text-muted-foreground mb-3">Every Sunday at 3:00 AM</p>
              <p className="text-xs text-muted-foreground">Retention: 90 days</p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-border">
              <p className="font-medium text-foreground mb-2">Monthly Backup</p>
              <p className="text-sm text-muted-foreground mb-3">1st of month at 4:00 AM</p>
              <p className="text-xs text-muted-foreground">Retention: 1 year</p>
            </div>
          </div>
        </Card>

        {/* Backups List */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Available Backups</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {backups.map((backup) => (
              <BackupCard key={backup.id} backup={backup} />
            ))}
          </div>
        </div>

        {/* Restore History */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Restore History</h2>
          <div className="space-y-4">
            {restoreHistory.map((restore) => (
              <div key={restore.id} className="p-4 border border-border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-foreground">{restore.backupLabel}</p>
                    <p className="text-sm text-muted-foreground">
                      Strategy: <span className="font-medium">{restore.strategy.toUpperCase()}</span>
                    </p>
                  </div>
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                    COMPLETED
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Items Processed</p>
                    <p className="font-medium text-foreground">{restore.itemsProcessed}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="font-medium text-foreground">{restore.duration}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Completed</p>
                    <p className="font-medium text-foreground">{restore.completedAt}</p>
                  </div>
                </div>

                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${restore.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Backup Best Practices */}
        <Card className="p-6 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-700 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-orange-900 mb-2">Backup Best Practices</h3>
              <ul className="text-sm text-orange-800 space-y-1">
                <li>✓ Create manual backups before major system changes</li>
                <li>✓ Test restore procedures regularly to ensure data integrity</li>
                <li>✓ Monitor backup completion and storage usage</li>
                <li>✓ Keep backups in multiple locations (local + S3)</li>
                <li>✓ Review retention policies periodically</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
