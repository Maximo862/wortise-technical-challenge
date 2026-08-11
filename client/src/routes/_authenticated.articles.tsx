import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/articles")({
  component: ArticlesPage,
});

function ArticlesPage() {
  return (
    <main className="p-4">
      <h1 className="text-xl font-semibold">My articles</h1>
      <p>Your articles will appear here.</p>
    </main>
  );
}
