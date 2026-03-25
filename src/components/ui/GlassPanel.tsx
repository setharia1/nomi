import { cn } from "@/lib/cn";

export function GlassPanel({
  className,
  children,
  muted,
  ...props
}: React.ComponentProps<"div"> & { muted?: boolean }) {
  return (
    <div
      className={cn(
        muted ? "glass-panel-muted rounded-xl" : "glass-panel rounded-xl",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
