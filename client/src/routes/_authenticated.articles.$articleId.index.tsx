import { AlertDialog, Button, useOverlayState } from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { articleQueryKeys } from "../features/articles/api/article-query-keys";
import {
  deleteArticle,
  getArticle,
} from "../features/articles/api/articles-api";
import { authClient } from "../lib/auth-client";

export const Route = createFileRoute(
  "/_authenticated/articles/$articleId/",
)({
  validateSearch: (search: Record<string, unknown>) => {
    const validatedSearch: { from?: "public" } = {};

    if (search.from === "public") {
      validatedSearch.from = "public";
    }

    return validatedSearch;
  },
  component: ArticleDetailPage,
});

function ArticleDetailPage() {
  const { articleId } = Route.useParams();
  const { from } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const deleteDialog = useOverlayState();
  const articleQuery = useQuery({
    queryKey: articleQueryKeys.detail(articleId),
    queryFn: () => getArticle(articleId),
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteArticle(articleId),
    onSuccess: () => {
      deleteDialog.close();
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
        <p className="text-red-600" role="alert">
          {articleQuery.error.message}
        </p>
        <Button onPress={() => articleQuery.refetch()}>Try again</Button>
      </main>
    );
  }

  const article = articleQuery.data;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          onPress={() => {
            if (from === "public") {
              navigate({ to: "/" });
              return;
            }
            navigate({ to: "/articles" });
          }}
          className="transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          Back
        </Button>
        {session?.user.id === article.authorId && (
          <div className="flex gap-2">
            <Button
              className="transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
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
              className="transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
              variant="danger"
              isDisabled={deleteMutation.isPending}
              onPress={deleteDialog.open}
            >
              Delete
            </Button>
          </div>
        )}
      </div>

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
          By {article.authorName} | Created{" "}
          {new Date(article.createdAt).toLocaleString()} | Updated{" "}
          {new Date(article.updatedAt).toLocaleString()}
        </p>
        <p className="whitespace-pre-wrap">{article.content}</p>
      </article>

      <AlertDialog
        isOpen={deleteDialog.isOpen}
        onOpenChange={(isOpen) => {
          if (!deleteMutation.isPending) {
            deleteDialog.setOpen(isOpen);
          }
        }}
      >
        <AlertDialog.Backdrop
          isKeyboardDismissDisabled={deleteMutation.isPending}
        >
          <AlertDialog.Container>
            <AlertDialog.Dialog>
              <AlertDialog.Header>
                <AlertDialog.Icon status="danger" />
                <AlertDialog.Heading>Delete article?</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p>
                  This action is irreversible. The article will be permanently
                  deleted.
                </p>
                {deleteMutation.isError && (
                  <p className="mt-2 text-sm text-red-600" role="alert">
                    {deleteMutation.error.message}
                  </p>
                )}
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button
                  variant="secondary"
                  isDisabled={deleteMutation.isPending}
                  onPress={deleteDialog.close}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  isDisabled={deleteMutation.isPending}
                  onPress={() => {
                    if (!deleteMutation.isPending) {
                      deleteMutation.mutate();
                    }
                  }}
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </main>
  );
}
