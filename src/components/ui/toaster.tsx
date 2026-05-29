"use client";

import { Check, AlertCircle, Info } from "lucide-react";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./toast";
import { useToast } from "./use-toast";
import { cn } from "@/lib/utils";

const iconConfig = {
  success: {
    Icon: Check,
    className: "bg-primary/10 text-primary",
  },
  destructive: {
    Icon: AlertCircle,
    className: "bg-destructive/10 text-destructive",
  },
  default: {
    Icon: Info,
    className: "bg-muted text-muted-foreground",
  },
} as const;

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider duration={4000}>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const config = iconConfig[variant ?? "default"] ?? iconConfig.default;
        const { Icon, className: iconClassName } = config;

        return (
          <Toast key={id} variant={variant} {...props}>
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                iconClassName
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.5} />
            </div>
            <div className="grid flex-1 gap-0.5 pt-0.5 min-w-0">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
