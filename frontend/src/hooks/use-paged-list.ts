"use client";

import { useMemo, useState } from "react";

/** Page-size choices offered everywhere pagination appears. */
export const PAGE_SIZE_OPTIONS = [10, 15, 20, 25, 50, 75, 100] as const;
export const DEFAULT_PAGE_SIZE = 10;

/**
 * Client-side search + pagination over an already-loaded array. Used by every
 * table / list / grid so the search and pager behave identically across the app.
 *
 * `getSearchText` returns the text a row is matched against (case-insensitive,
 * substring). Changing the query or page size resets to page 1; the current
 * page is always clamped into range as the filtered list shrinks.
 */
export function usePagedList<T>(
  items: T[],
  getSearchText: (item: T) => string,
  initialPageSize: number = DEFAULT_PAGE_SIZE
) {
  const [query, setQueryRaw] = useState("");
  const [pageSize, setPageSizeRaw] = useState(initialPageSize);
  const [page, setPageRaw] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      getSearchText(item).toLowerCase().includes(q)
    );
    // getSearchText is treated as pure; callers pass a stable-enough closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, query]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  return {
    query,
    setQuery: (value: string) => {
      setQueryRaw(value);
      setPageRaw(1);
    },
    pageSize,
    setPageSize: (size: number) => {
      setPageSizeRaw(size);
      setPageRaw(1);
    },
    page: currentPage,
    setPage: (next: number) =>
      setPageRaw(Math.max(1, Math.min(next, pageCount))),
    pageCount,
    total,
    rangeStart: total === 0 ? 0 : start + 1,
    rangeEnd: start + pageItems.length,
    pageItems,
  };
}
