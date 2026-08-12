import { Button } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { articleQueryKeys } from "../features/articles/api/article-query-keys";
import { getOwnArticles } from "../features/articles/api/articles-api";

export const Route = createFileRoute("/_authenticated/articles/")({
  component: ArticlesPage,
});

function ArticlesPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const articlesQuery = useQuery({
    queryKey: articleQueryKeys.minePage(page),
    queryFn: () => getOwnArticles(page),
  });

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">My articles</h1>
        <Button onPress={() => navigate({ to: "/articles/new" })}>
          New article
        </Button>
      </div>

      {articlesQuery.isPending ? (
        <p>Loading articles...</p>
      ) : articlesQuery.isError ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-red-600">{articlesQuery.error.message}</p>
          <Button onPress={() => articlesQuery.refetch()}>Try again</Button>
        </div>
      ) : articlesQuery.data.articles.length === 0 ? (
        <div className="rounded-lg border p-6 text-center">
          <p>You have not created any articles yet.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {articlesQuery.data.articles.map((article) => (
              <article
                key={article.id}
                className="flex flex-col gap-2 rounded-lg border p-4"
              >
                <h2 className="text-lg font-semibold">{article.title}</h2>
                <p className="line-clamp-2 whitespace-pre-wrap text-sm text-gray-600">
                  {article.content}
                </p>
                <div className="flex items-center justify-between gap-4">
                  <time className="text-xs text-gray-500">
                    Updated {new Date(article.updatedAt).toLocaleDateString()}
                  </time>
                  <Button
                    onPress={() =>
                      navigate({
                        to: "/articles/$articleId",
                        params: { articleId: article.id },
                      })
                    }
                  >
                    View
                  </Button>
                </div>
              </article>
            ))}
          </div>

          <div className="flex items-center justify-between gap-4">
            <Button
              isDisabled={page === 1 || articlesQuery.isFetching}
              onPress={() => setPage((currentPage) => currentPage - 1)}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {articlesQuery.data.pagination.page} of{" "}
              {articlesQuery.data.pagination.totalPages}
            </span>
            <Button
              isDisabled={
                page >= articlesQuery.data.pagination.totalPages ||
                articlesQuery.isFetching
              }
              onPress={() => setPage((currentPage) => currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </main>
  );
}
