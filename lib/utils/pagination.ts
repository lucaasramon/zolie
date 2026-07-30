export interface PaginationQuery {
  page?: string | number;
  perPage?: string | number;
}

export interface Pagination {
  page: number;
  perPage: number;
  skip: number;
  take: number;
}

export function parsePagination(query: PaginationQuery = {}): Pagination {
  const page = Math.max(1, Number(query.page) || 1);
  const perPage = Math.min(60, Math.max(1, Number(query.perPage) || 12));
  return { page, perPage, skip: (page - 1) * perPage, take: perPage };
}

export function meta(total: number, { page, perPage }: { page: number; perPage: number }) {
  return { total, page, perPage, totalPages: Math.max(1, Math.ceil(total / perPage)) };
}
