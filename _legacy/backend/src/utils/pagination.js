const parsePagination = (query = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const perPage = Math.min(60, Math.max(1, Number(query.perPage) || 12));
  return { page, perPage, skip: (page - 1) * perPage, take: perPage };
};

const meta = (total, { page, perPage }) => ({
  total, page, perPage, totalPages: Math.max(1, Math.ceil(total / perPage))
});

module.exports = { parsePagination, meta };
