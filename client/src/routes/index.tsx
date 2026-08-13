import { Button, Input, Label, TextField } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { articleQueryKeys } from "../features/articles/api/article-query-keys";
import {
  getPublicAuthors,
  searchPublicArticles,
} from "../features/articles/api/articles-api";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const [draftSearch, setDraftSearch] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const authorsQuery = useQuery({
    queryKey: articleQueryKeys.publicAuthors(),
    queryFn: getPublicAuthors,
  });
  const articlesQuery = useQuery({
    queryKey: articleQueryKeys.publicSearch(search, page),
    queryFn: () => searchPublicArticles(search, page),
  });

  function applySearch(value: string) {
    const normalizedSearch = value.trim();
    setDraftSearch(normalizedSearch);
    setSearch(normalizedSearch);
    setPage(1);
  }

  return (
    <main className="mx-auto grid max-w-5xl gap-8 p-4 md:grid-cols-[14rem_1fr]">
      <aside className="flex min-w-0 flex-col gap-3">
        <h2 className="text-xl font-semibold">Authors</h2>
        {authorsQuery.isPending ? (
          <p>Loading authors...</p>
        ) : authorsQuery.isError ? (
          <div className="flex flex-col items-start gap-2">
            <p className="text-sm text-red-600">{authorsQuery.error.message}</p>
            <Button onPress={() => authorsQuery.refetch()}>Try again</Button>
          </div>
        ) : authorsQuery.data.length === 0 ? (
          <p className="text-sm text-gray-600">There are no authors yet.</p>
        ) : (
          <div className="flex w-full min-w-0 snap-x snap-proximity gap-2 overflow-x-auto overscroll-x-contain pb-2 md:flex-col md:items-start md:overflow-visible">
            {authorsQuery.data.map((author) => (
              <Button
                key={author.id}
                className="shrink-0 snap-start"
                onPress={() => applySearch(author.name)}
              >
                {author.name} ({author.articleCount})
              </Button>
            ))}
          </div>
        )}
      </aside>

      <section className="flex min-w-0 flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">Explore articles</h1>
          <form
            className="flex flex-col items-end gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              applySearch(draftSearch);
            }}
          >
            <TextField
              className="w-full"
              value={draftSearch}
              onChange={setDraftSearch}
            >
              <Label>Search by title, content, or author</Label>
              <Input placeholder="Search articles" />
            </TextField>
            <Button type="submit">Search</Button>
          </form>
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
            <p>No articles matched your search.</p>
          </div>
        ) : (
          <>
            {search && (
              <p className="text-sm text-gray-600">
                Results for &quot;{search}&quot;
              </p>
            )}
            <div className="flex flex-col gap-4">
              {articlesQuery.data.articles.map((article) => (
                <article
                  key={article.id}
                  className="grid gap-4 rounded-lg border p-4 sm:grid-cols-[8rem_1fr]"
                >
                  {article.coverImageUrl ? (
                    <img
                      className="h-32 w-full rounded-md object-cover"
                      src={article.coverImageUrl}
                      alt=""
                    />
                  ) : (
                    <div className="hidden h-32 rounded-md bg-gray-100 sm:block" />
                  )}
                  <div className="flex min-w-0 flex-col gap-2">
                    <h2 className="text-lg font-semibold">{article.title}</h2>
                    <p className="line-clamp-3 whitespace-pre-wrap text-sm text-gray-700">
                      {article.content}
                    </p>
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-xs text-gray-500">
                        By {article.authorName} ·{" "}
                        {new Date(article.createdAt).toLocaleDateString()}
                      </p>
                      <Button
                        onPress={() =>
                          navigate({
                            to: "/articles/$articleId",
                            params: { articleId: article.id },
                            search: { from: "public" },
                          })
                        }
                      >
                        View
                      </Button>
                    </div>
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
      </section>
    </main>
  );
}
