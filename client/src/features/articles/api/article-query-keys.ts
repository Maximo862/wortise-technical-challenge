export const articleQueryKeys = {
  all: ["articles"] as const,
  mine: () => [...articleQueryKeys.all, "mine"] as const,
  minePage: (page: number) => [...articleQueryKeys.mine(), { page }] as const,
  details: () => [...articleQueryKeys.all, "detail"] as const,
  detail: (articleId: string) =>
    [...articleQueryKeys.details(), articleId] as const,
};
