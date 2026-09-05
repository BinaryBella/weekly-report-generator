"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { PAGE_SIZE_OPTIONS } from "@/hooks/use-paged-list";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * The single pagination bar: "N–M of T", a per-page size picker, and
 * prev / next controls. Stacks vertically on small screens.
 */
export function ListPagination({
  page,
  pageCount,
  pageSize,
  total,
  rangeStart,
  rangeEnd,
  onPageChange,
  onPageSizeChange,
  itemLabel = "items",
}: {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  rangeStart: number;
  rangeEnd: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  itemLabel?: string;
}) {
  if (total === 0) return null;

  return (
    <div className="flex flex-col gap-3 border-t pt-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <p>
        {rangeStart}&ndash;{rangeEnd} of {total} {itemLabel}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <span className="hidden sm:inline">Per page</span>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => onPageSizeChange(Number(v))}
        >
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[6rem] text-center">
            Page {page} of {pageCount}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
