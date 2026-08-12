import { Hono, type Context } from "hono";
import { publicArticleSearchSchema } from "shared";
import {
  listPublicAuthors,
  searchArticles,
} from "../articles/articles.service";

const publicRoute = new Hono();

function unexpectedError(c: Context, error: unknown) {
  console.error("Public articles request failed:", error);
  return c.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    },
    500,
  );
}

publicRoute.get("/authors", async (c) => {
  try {
    const authors = await listPublicAuthors();
    return c.json({ authors });
  } catch (error) {
    return unexpectedError(c, error);
  }
});

publicRoute.get("/search", async (c) => {
  const result = publicArticleSearchSchema.safeParse(c.req.query());

  if (!result.success) {
    return c.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid search parameters",
          issues: result.error.issues.map((issue) => ({
            field: issue.path.map(String).join("."),
            message: issue.message,
          })),
        },
      },
      400,
    );
  }

  try {
    const articles = await searchArticles(result.data);
    return c.json(articles);
  } catch (error) {
    return unexpectedError(c, error);
  }
});

export { publicRoute };
