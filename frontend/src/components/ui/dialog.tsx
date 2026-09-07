"use client";

/**
 * A small, dependency-free modal dialog.
 *
 * The project's shadcn setup does not include `@radix-ui/react-dialog`, so this
 * is a hand-rolled equivalent that keeps the same component surface
 * (`Dialog` / `DialogContent` / `DialogHeader` / ...) and the same Tailwind
 * design tokens. It is controlled: pass `open` and `onOpenChange`.
 */

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

interface DialogContextValue {
  onOpenChange: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue | null>(null);

function useDialogContext(component: string): DialogContextValue {
  const ctx = React.useContext(DialogContext);
  if (!ctx) {
    throw new Error(`<${component}> must be used inside <Dialog>`);
  }
  return ctx;
}

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

function Dialog({ open, onOpenChange, children }: DialogProps) {
  const value = React.useMemo(() => ({ onOpenChange }), [onOpenChange]);

  // Lock body scroll while any dialog is open.
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
    <DialogContext.Provider value={value}>{children}</DialogContext.Provider>
  );
}

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    /** Hide the built-in top-right close button. */
    hideCloseButton?: boolean;
  }
>(({ className, children, hideCloseButton = false, ...props }, ref) => {
  const { onOpenChange } = useDialogContext("DialogContent");
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
    // Move focus into the dialog when it opens.
    panelRef.current?.focus();
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        aria-hidden
        onClick={() => onOpenChange(false)}
        className="absolute inset-0 bg-black/50 animate-in fade-in-0"
      />
      <div
        ref={(node) => {
          panelRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={cn(
          "relative z-50 grid w-full max-w-lg gap-4 rounded-lg border bg-background p-6 shadow-lg outline-none animate-in fade-in-0 zoom-in-95 sm:rounded-lg",
          className
        )}
        {...props}
      >
        {children}
        {hideCloseButton ? null : (
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        )}
      </div>
    </div>,
    document.body
  );
});
DialogContent.displayName = "DialogContent";

function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 text-left", className)}
      {...props}
    />
  );
}
DialogHeader.displayName = "DialogHeader";

function DialogFooter({
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
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
