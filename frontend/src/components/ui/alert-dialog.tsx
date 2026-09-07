"use client";

/**
 * A small, dependency-free confirmation dialog.
 *
 * Mirrors shadcn's `AlertDialog` surface without `@radix-ui/react-alert-dialog`
 * (not installed in this project). Unlike `Dialog`, clicking the backdrop does
 * not dismiss it — the user must choose Cancel or the action. It is controlled:
 * pass `open` and `onOpenChange`.
 */

import * as React from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface AlertDialogContextValue {
  onOpenChange: (open: boolean) => void;
}

const AlertDialogContext =
  React.createContext<AlertDialogContextValue | null>(null);

function useAlertDialogContext(component: string): AlertDialogContextValue {
  const ctx = React.useContext(AlertDialogContext);
  if (!ctx) {
    throw new Error(`<${component}> must be used inside <AlertDialog>`);
  }
  return ctx;
}

export interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

function AlertDialog({ open, onOpenChange, children }: AlertDialogProps) {
  const value = React.useMemo(() => ({ onOpenChange }), [onOpenChange]);

  React.useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  return (
    <AlertDialogContext.Provider value={value}>
      {children}
    </AlertDialogContext.Provider>
  );
}

const AlertDialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { onOpenChange } = useAlertDialogContext("AlertDialogContent");
  const [mounted, setMounted] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onOpenChange(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onOpenChange]);

  React.useEffect(() => {
    panelRef.current?.focus();
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div aria-hidden className="absolute inset-0 bg-black/50 animate-in fade-in-0" />
      <div
        ref={(node) => {
          panelRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        role="alertdialog"
        aria-modal="true"
        tabIndex={-1}
        className={cn(
          "relative z-50 grid w-full max-w-lg gap-4 rounded-lg border bg-background p-6 shadow-lg outline-none animate-in fade-in-0 zoom-in-95",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </div>,
    document.body
  );
});
AlertDialogContent.displayName = "AlertDialogContent";

function AlertDialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-2 text-left", className)}
      {...props}
    />
  );
}
AlertDialogHeader.displayName = "AlertDialogHeader";

function AlertDialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  );
}
AlertDialogFooter.displayName = "AlertDialogFooter";

const AlertDialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-lg font-semibold", className)}
    {...props}
  />
));
AlertDialogTitle.displayName = "AlertDialogTitle";

const AlertDialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
AlertDialogDescription.displayName = "AlertDialogDescription";

/** Confirm button. Behaves like a normal <button>; caller wires `onClick`. */
const AlertDialogAction = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(buttonVariants(), className)}
    {...props}
  />
));
AlertDialogAction.displayName = "AlertDialogAction";

/** Cancel button. Closes the dialog, then runs any `onClick` the caller passes. */
const AlertDialogCancel = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, onClick, ...props }, ref) => {
  const { onOpenChange } = useAlertDialogContext("AlertDialogCancel");
  return (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant: "outline" }), className)}
      onClick={(event) => {
        onOpenChange(false);
        onClick?.(event);
      }}
      {...props}
    />
  );
});
AlertDialogCancel.displayName = "AlertDialogCancel";

export {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
