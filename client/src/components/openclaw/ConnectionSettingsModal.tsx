import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface ConnectionSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (data: { host: string; token?: string }) => void;
}

export function ConnectionSettingsModal({
  isOpen,
  onClose,
  onConnect,
}: ConnectionSettingsModalProps) {
  const [host, setHost] = useState(
    localStorage.getItem("openclaw_host") || "http://localhost:3000"
  );
  const [token, setToken] = useState(
    localStorage.getItem("openclaw_token") || ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleConnect = async () => {
    if (!host.trim()) {
      setStatus({
        type: "error",
        message: "Host URL is required",
      });
      return;
    }

    setIsLoading(true);
    setStatus({ type: null, message: "" });

    try {
      // Save to localStorage
      localStorage.setItem("openclaw_host", host);
      if (token) {
        localStorage.setItem("openclaw_token", token);
      } else {
        localStorage.removeItem("openclaw_token");
      }

      // Call connect mutation
      onConnect({
        host,
        token: token || undefined,
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Connection failed",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>OpenClaw Connection Settings</DialogTitle>
          <DialogClose />
        </DialogHeader>

        <div className="space-y-4">
          {/* Host URL */}
          <div className="space-y-2">
            <Label htmlFor="host">Host URL</Label>
            <Input
              id="host"
              placeholder="http://localhost:3000"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              The URL where your OpenClaw host is running
            </p>
          </div>

          {/* API Token */}
          <div className="space-y-2">
            <Label htmlFor="token">API Token (Optional)</Label>
            <Input
              id="token"
              type="password"
              placeholder="Leave empty if not required"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Authentication token if your OpenClaw requires it
            </p>
          </div>

          {/* Status Message */}
          {status.type && (
            <Card
              className={
                status.type === "success"
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }
            >
              <CardContent className="pt-4 flex gap-2">
                {status.type === "success" ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div
                  className={
                    status.type === "success"
                      ? "text-sm text-green-800"
                      : "text-sm text-red-800"
                  }
                >
                  {status.message}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info Card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="text-xs text-blue-900 space-y-1">
                <p className="font-semibold">Connection Information:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Ensure OpenClaw host is running and accessible</li>
                  <li>Settings are saved to browser localStorage</li>
                  <li>Connection will start automatic polling</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleConnect}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
