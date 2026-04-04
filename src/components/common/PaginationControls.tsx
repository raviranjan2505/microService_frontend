"use client";

type PaginationControlsProps = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  currentCount: number;
  itemLabel: string;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

const PAGE_SIZE_OPTIONS = [5, 10, 20];

function getVisiblePages(page: number, totalPages: number) {
  const pages = new Set<number>([1, totalPages, page - 1, page, page + 1]);
  return Array.from(pages)
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);
}

export default function PaginationControls({
  page,
  pageSize,
  totalCount,
  totalPages,
  currentCount,
  itemLabel,
  isLoading = false,
  onPageChange,
  onPageSizeChange,
}: PaginationControlsProps) {
  if (!totalCount || totalPages <= 1) return null;

  const rangeStart = (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalCount);
  const visiblePages = getVisiblePages(page, totalPages);

  return (
    <div className="mt-6 rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 text-sm text-gray-600">
          <p>
            Showing <span className="font-medium text-gray-900">{rangeStart}</span>-
            <span className="font-medium text-gray-900">{rangeEnd}</span> of{" "}
            <span className="font-medium text-gray-900">{totalCount}</span> {itemLabel}
            {currentCount !== rangeEnd - rangeStart + 1 ? (
              <> {" "}(<span className="font-medium text-gray-900">{currentCount}</span> visible)</>
            ) : null}
          </p>

          <label className="flex items-center gap-2">
            <span>Rows</span>
            <select
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              disabled={isLoading}
              className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || isLoading}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>

          {visiblePages.map((pageNumber, index) => {
            const previousPage = visiblePages[index - 1];
            const shouldShowGap = previousPage && pageNumber - previousPage > 1;

            return (
              <div key={pageNumber} className="flex items-center gap-2">
                {shouldShowGap ? <span className="px-1 text-gray-400">...</span> : null}
                <button
                  type="button"
                  onClick={() => onPageChange(pageNumber)}
                  disabled={isLoading}
                  className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                    pageNumber === page
                      ? "bg-green-600 text-white"
                      : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {pageNumber}
                </button>
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || isLoading}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
