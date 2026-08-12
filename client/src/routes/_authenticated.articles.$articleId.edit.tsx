import { Button } from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { articleQueryKeys } from "../features/articles/api/article-query-keys";
import {
  getArticle,
  updateArticle,
} from "../features/articles/api/articles-api";
import { ArticleForm } from "../features/articles/components/ArticleForm";

export const Route = createFileRoute(
  "/_authenticated/articles/$articleId/edit",
)({
  component: EditArticlePage,
});

function EditArticlePage() {
  const { articleId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const articleQuery = useQuery({
    queryKey: articleQueryKeys.detail(articleId),
    queryFn: () => getArticle(articleId),
  });
  const updateMutation = useMutation({
    mutationFn: (values: Parameters<typeof updateArticle>[1]) =>
      updateArticle(articleId, values),
    onSuccess: (article) => {
      queryClient.setQueryData(
        articleQueryKeys.detail(article.id),
        article,
      );
      queryClient.invalidateQueries({ queryKey: articleQueryKeys.mine() });
      navigate({
        to: "/articles/$articleId",
        params: { articleId: article.id },
      });
    },
  });

  if (articleQuery.isPending) {
    return <main className="p-4">Loading article...</main>;
  }

  if (articleQuery.isError) {
    return (
      <main className="mx-auto flex max-w-2xl flex-col items-start gap-3 p-4">
        <p className="text-red-600">{articleQuery.error.message}</p>
        <Button onPress={() => articleQuery.refetch()}>Try again</Button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-4">
      <h1 className="text-2xl font-semibold">Edit article</h1>
      <ArticleForm
        initialValues={{
          title: articleQuery.data.title,
          content: articleQuery.data.content,
          coverImageUrl: articleQuery.data.coverImageUrl ?? "",
        }}
        submitLabel="Save changes"
        submittingLabel="Saving..."
        onCancel={() =>
          navigate({
            to: "/articles/$articleId",
            params: { articleId },
          })
        }
        onSubmit={(values) => updateMutation.mutateAsync(values)}
      />
    </main>
  );
}
