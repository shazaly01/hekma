import { useMemo, useState, useEffect } from "react";

const DEFAULT_PAGE_SIZE = 25;

export function usePagination<T>(items: T[], pageSize = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // Reset to page 1 when items change (e.g. filters applied)
  useEffect(() => {
    setPage(1);
  }, [items.length]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  return {
    page,
    setPage,
    totalPages,
    paginatedItems,
    totalItems: items.length,
    pageSize,
  };
}
