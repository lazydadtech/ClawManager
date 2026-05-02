import { useCallback } from "react";

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
}

export function useToast() {
  const toast = useCallback((options: ToastOptions) => {
    // Simple implementation - in production, use a toast library like sonner
    const message = options.title
      ? `${options.title}${options.description ? ": " + options.description : ""}`
      : options.description || "Notification";

    if (options.variant === "destructive") {
      console.error(message);
    } else if (options.variant === "success") {
      console.log("✓", message);
    } else {
      console.log(message);
    }

    // You can replace this with a real toast library
    // import { toast } from "sonner";
    // toast.success(message) etc.
  }, []);

  return { toast };
}
