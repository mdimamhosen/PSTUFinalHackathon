import * as React from "react";
import { cn } from "../lib/utils";
import { EmptyState } from "./empty-state";
import { Skeleton } from "./skeleton";

export function DataTable({
  headers,
  loading,
  emptyTitle = "No results",
  emptyDescription,
  children,
  className,
}: {
  headers: string[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const rows = React.Children.toArray(children);
  return (
    <div className={cn("overflow-hidden rounded-2xl border bg-[hsl(var(--card))]", className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b bg-[hsl(var(--muted))]/60 text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
            <tr>
              {headers.map((h) => (
                <th key={h} className="px-4 py-3 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[hsl(var(--border))]/80">{children}</tbody>
        </table>
      </div>
      {loading ? (
        <div className="space-y-2 p-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : null}
      {!loading && rows.length === 0 ? (
        <div className="p-4">
          <EmptyState title={emptyTitle} description={emptyDescription} />
        </div>
      ) : null}
    </div>
  );
}
