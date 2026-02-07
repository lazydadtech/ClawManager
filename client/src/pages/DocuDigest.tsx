import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const documents = [
  {
    id: 1,
    name: "Q4 Financial Report.pdf",
    size: "2.4 MB",
    pages: 45,
    status: "completed",
    progress: 100,
    uploadedAt: "2 hours ago",
    processedAt: "1 hour ago",
    processingTime: "15 minutes",
  },
  {
    id: 2,
    name: "Market Analysis 2024.pdf",
    size: "3.8 MB",
    pages: 78,
    status: "completed",
    progress: 100,
    uploadedAt: "1 day ago",
    processedAt: "23 hours ago",
    processingTime: "22 minutes",
  },
  {
    id: 3,
    name: "Customer Feedback Summary.pdf",
    size: "1.2 MB",
    pages: 28,
    status: "processing",
    progress: 65,
    uploadedAt: "30 minutes ago",
    processingTime: "~8 minutes remaining",
  },
  {
    id: 4,
    name: "Competitive Intelligence.pdf",
    size: "5.1 MB",
    pages: 120,
    status: "pending",
    progress: 0,
    uploadedAt: "5 minutes ago",
  },
];

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return (
        <div className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-medium">
          <CheckCircle className="w-3 h-3" />
          Completed
        </div>
      );
    case "processing":
      return (
        <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-xs font-medium">
          <Zap className="w-3 h-3 animate-pulse" />
          Processing
        </div>
      );
    case "pending":
      return (
        <div className="flex items-center gap-1 text-orange-600 bg-orange-50 px-3 py-1 rounded-full text-xs font-medium">
          <AlertCircle className="w-3 h-3" />
          Pending
        </div>
      );
    default:
      return null;
  }
}

export default function DocuDigest() {
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
        <div>
          <h1 className="text-3xl font-bold text-foreground">DocuDigest</h1>
          <p className="text-muted-foreground mt-1">
            High-speed PDF upload and intelligent document processing
          </p>
        </div>

        {/* Upload Section */}
        <Card className="p-8 border-2 border-dashed border-primary/30 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-foreground mb-1">
                Upload Documents
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop PDF files or click to browse
              </p>
            </div>
            <Button size="lg">
              <Upload className="w-4 h-4 mr-2" />
              Select Files
            </Button>
            <p className="text-xs text-muted-foreground">
              Processes up to 50 pages per second
            </p>
          </div>
        </Card>

        {/* Processing Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
            <p className="text-sm font-medium text-muted-foreground">Processed</p>
            <p className="text-2xl font-bold text-foreground mt-1">2</p>
            <p className="text-xs text-muted-foreground mt-2">123 pages total</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
            <p className="text-sm font-medium text-muted-foreground">Processing</p>
            <p className="text-2xl font-bold text-foreground mt-1">1</p>
            <p className="text-xs text-muted-foreground mt-2">28 pages</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
            <p className="text-sm font-medium text-muted-foreground">Queued</p>
            <p className="text-2xl font-bold text-foreground mt-1">1</p>
            <p className="text-xs text-muted-foreground mt-2">120 pages</p>
          </Card>
        </div>

        {/* Documents List */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Documents</h2>
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-4 border border-border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <FileText className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{doc.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {doc.size} • {doc.pages} pages • Uploaded {doc.uploadedAt}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={doc.status} />
                </div>

                {doc.status !== "pending" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium text-foreground">{doc.progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${doc.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {doc.status === "completed" && (
                  <p className="text-xs text-muted-foreground mt-3">
                    ✓ Processed in {doc.processingTime}
                  </p>
                )}

                {doc.status === "processing" && (
                  <p className="text-xs text-blue-600 mt-3">
                    ⏱ {doc.processingTime}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Information Card */}
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <h3 className="font-semibold text-foreground mb-2">About DocuDigest</h3>
          <p className="text-sm text-muted-foreground mb-4">
            DocuDigest uses advanced PDF processing technology to extract and digest document content at high speed. Processed documents are integrated into Jarvis's knowledge base, enabling intelligent decision-making and contextual understanding.
          </p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>✓ Process up to 50 pages per second</li>
            <li>✓ Automatic text extraction and analysis</li>
            <li>✓ Integration with agent knowledge base</li>
            <li>✓ Full document history and retrieval</li>
          </ul>
        </Card>
      </div>
    </DashboardLayout>
  );
}
