import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <main className="p-4">
      <h1 className="text-xl font-semibold">Articles</h1>
    </main>
  );
}
