import { cn } from "@/lib/cn";

/** Unified page title stack — matches feed-era typography rhythm. */
export function PageHeader({
  kicker,
  title,
  description,
  className,
}: {
  kicker?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <header className={cn("space-y-1", className)}>
      {kicker ? <p className="nomi-kicker">{kicker}</p> : null}
      <h1 className="nomi-page-title">{title}</h1>
      {description ? <p className="nomi-page-desc">{description}</p> : null}
    </header>
  );
}
