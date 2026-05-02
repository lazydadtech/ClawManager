import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface CommandExecutionModalProps {
  agent: {
    id: string;
    name: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AVAILABLE_COMMANDS = [
  {
    id: "restart",
    name: "Restart Agent",
    description: "Restart the agent process",
    icon: "🔄",
  },
  {
    id: "pause",
    name: "Pause Tasks",
    description: "Pause task execution",
    icon: "⏸️",
  },
  {
    id: "resume",
    name: "Resume Tasks",
    description: "Resume task execution",
    icon: "▶️",
  },
  {
    id: "collect_metrics",
    name: "Collect Metrics",
    description: "Force metrics collection",
    icon: "📊",
  },
];

export function CommandExecutionModal({
  agent,
  isOpen,
  onClose,
  onSuccess,
}: CommandExecutionModalProps) {
  const [selectedCommand, setSelectedCommand] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    commandId?: string;
  } | null>(null);

  const { mutate: executeCommand, isPending } = trpc.openclaw.executeCommand.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setResult({
          success: true,
          message: `Command executed successfully`,
          commandId: data.command?.id,
        });
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setResult({
          success: false,
          message: data.error || "Failed to execute command",
        });
      }
    },
    onError: (error) => {
      setResult({
        success: false,
        message: error.message || "Failed to execute command",
      });
    },
  });

  const handleExecuteCommand = () => {
    if (!selectedCommand) return;

    const command = AVAILABLE_COMMANDS.find((c) => c.id === selectedCommand);
    if (!command) return;

    executeCommand({
      agentId: agent.id,
      action: selectedCommand,
    });

    setShowConfirm(false);
  };

  const selectedCommandData = AVAILABLE_COMMANDS.find(
    (c) => c.id === selectedCommand
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Execute Command</DialogTitle>
          <DialogClose />
        </DialogHeader>

        {result ? (
          <div className="space-y-4">
            <div
              className={`p-4 rounded-lg flex gap-3 ${
                result.success
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <div
                  className={`font-semibold ${
                    result.success ? "text-green-900" : "text-red-900"
                  }`}
                >
                  {result.success ? "Success" : "Error"}
                </div>
                <div
                  className={`text-sm ${
                    result.success ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {result.message}
                </div>
                {result.commandId && (
                  <div className="text-xs mt-2 font-mono text-muted-foreground">
                    ID: {result.commandId}
                  </div>
                )}
              </div>
            </div>

            <Button className="w-full" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Select a command to execute on <span className="font-semibold">{agent.name}</span>
            </div>

            <div className="space-y-2">
              {AVAILABLE_COMMANDS.map((command) => (
                <Card
                  key={command.id}
                  className={`cursor-pointer transition-all ${
                    selectedCommand === command.id
                      ? "ring-2 ring-blue-500 bg-blue-50"
                      : "hover:shadow-md"
                  }`}
                  onClick={() => setSelectedCommand(command.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{command.icon}</div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{command.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {command.description}
                        </div>
                      </div>
                      {selectedCommand === command.id && (
                        <Badge variant="default">Selected</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={() => setShowConfirm(true)}
                disabled={!selectedCommand || isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Executing...
                  </>
                ) : (
                  "Execute"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Confirmation Dialog */}
        <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Command Execution</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to execute{" "}
                <span className="font-semibold">{selectedCommandData?.name}</span> on{" "}
                <span className="font-semibold">{agent.name}</span>? This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-2">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleExecuteCommand}
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Executing...
                  </>
                ) : (
                  "Execute"
                )}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
