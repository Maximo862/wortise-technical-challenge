import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { articleQueryKeys } from "../features/articles/api/article-query-keys";
import { createArticle } from "../features/articles/api/articles-api";
import { ArticleForm } from "../features/articles/components/ArticleForm";

export const Route = createFileRoute("/_authenticated/articles/new")({
  component: NewArticlePage,
});

function NewArticlePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createMutation = useMutation({
    mutationFn: createArticle,
    onSuccess: (article) => {
      queryClient.setQueryData(
        articleQueryKeys.detail(article.id),
        article,
      );
      queryClient.invalidateQueries({ queryKey: articleQueryKeys.mine() });
      queryClient.invalidateQueries({
        queryKey: articleQueryKeys.publicRoot(),
      });
      navigate({
        to: "/articles/$articleId",
        params: { articleId: article.id },
      });
    },
  });

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-4">
      <h1 className="text-2xl font-semibold">New article</h1>
      <ArticleForm
        submitLabel="Create article"
        submittingLabel="Creating..."
        onCancel={() => navigate({ to: "/articles" })}
        onSubmit={(values) => createMutation.mutateAsync(values)}
      />
    </main>
  );
}
