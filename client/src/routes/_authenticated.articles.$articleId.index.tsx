import { Button } from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { articleQueryKeys } from "../features/articles/api/article-query-keys";
import {
  deleteArticle,
  getArticle,
} from "../features/articles/api/articles-api";

export const Route = createFileRoute(
  "/_authenticated/articles/$articleId/",
)({
  component: ArticleDetailPage,
});

function ArticleDetailPage() {
  const { articleId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const articleQuery = useQuery({
    queryKey: articleQueryKeys.detail(articleId),
    queryFn: () => getArticle(articleId),
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteArticle(articleId),
    onSuccess: () => {
      queryClient.removeQueries({
        queryKey: articleQueryKeys.detail(articleId),
      });
      queryClient.invalidateQueries({ queryKey: articleQueryKeys.mine() });
      queryClient.invalidateQueries({
        queryKey: articleQueryKeys.publicRoot(),
      });
      navigate({ to: "/articles" });
    },
  });

  if (articleQuery.isPending) {
    return <main className="p-4">Loading article...</main>;
  }

  if (articleQuery.isError) {
    return (
      <main className="mx-auto flex max-w-3xl flex-col items-start gap-3 p-4">
        <p className="text-red-600">{articleQuery.error.message}</p>
        <Button onPress={() => articleQuery.refetch()}>Try again</Button>
      </main>
    );
  }

  const article = articleQuery.data;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button onPress={() => navigate({ to: "/articles" })}>
          Back
        </Button>
        <div className="flex gap-2">
          <Button
            onPress={() =>
              navigate({
                to: "/articles/$articleId/edit",
                params: { articleId },
              })
            }
          >
            Edit
          </Button>
          <Button
            isDisabled={deleteMutation.isPending}
            onPress={() => {
              if (window.confirm("Delete this article permanently?")) {
                deleteMutation.mutate();
              }
            }}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>

      {deleteMutation.isError && (
        <p className="text-sm text-red-600">
          {deleteMutation.error.message}
        </p>
      )}

      <article className="flex flex-col gap-4">
        {article.coverImageUrl && (
          <img
            className="max-h-96 w-full rounded-lg object-cover"
            src={article.coverImageUrl}
            alt=""
          />
        )}
        <h1 className="text-3xl font-semibold">{article.title}</h1>
        <p className="text-sm text-gray-500">
          By {article.authorName} · Updated{" "}
          {new Date(article.updatedAt).toLocaleString()}
        </p>
        <p className="whitespace-pre-wrap">{article.content}</p>
      </article>
    </main>
  );
}
