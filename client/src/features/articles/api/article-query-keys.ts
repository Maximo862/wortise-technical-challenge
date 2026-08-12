export const articleQueryKeys = {
  all: ["articles"] as const,
  mine: () => [...articleQueryKeys.all, "mine"] as const,
  minePage: (page: number) => [...articleQueryKeys.mine(), { page }] as const,
  details: () => [...articleQueryKeys.all, "detail"] as const,
  detail: (articleId: string) =>
    [...articleQueryKeys.details(), articleId] as const,
  publicRoot: () => [...articleQueryKeys.all, "public"] as const,
  publicAuthors: () => [...articleQueryKeys.publicRoot(), "authors"] as const,
  publicSearch: (query: string, page: number) =>
    [
      ...articleQueryKeys.publicRoot(),
      "search",
      { query, page },
    ] as const,
};
