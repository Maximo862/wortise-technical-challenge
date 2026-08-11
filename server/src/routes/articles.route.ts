import {
  articlesPaginationSchema,
  createArticleSchema,
  updateArticleSchema,
} from "shared";
import { Hono, type Context } from "hono";
import {
  createArticle,
  deleteArticle,
  getArticle,
  listOwnArticles,
  updateArticle,
  ArticleServiceError,
} from "../articles/articles.service";
import {
  requireAuthentication,
  type AuthenticatedVariables,
} from "../middlewares/require-auth.middleware";

type ArticlesEnv = {
  Variables: AuthenticatedVariables;
};

type ValidationIssue = {
  message: string;
  path: readonly PropertyKey[];
};

const articlesRoute = new Hono<ArticlesEnv>();

articlesRoute.use("*", requireAuthentication);

function validationError(
  c: Context<ArticlesEnv>,
  message: string,
  issues: readonly ValidationIssue[],
) {
  return c.json(
    {
      error: {
        code: "VALIDATION_ERROR",
        message,
        issues: issues.map((issue) => ({
          field: issue.path.map(String).join("."),
          message: issue.message,
        })),
      },
    },
    400,
  );
}

function articleError(c: Context<ArticlesEnv>, error: unknown) {
  if (error instanceof ArticleServiceError) {
    return c.json(
      {
        error: {
          code: error.code,
          message: error.message,
        },
      },
      error.status,
    );
  }

  console.error("Article request failed:", error);

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

articlesRoute.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const result = createArticleSchema.safeParse(body);

  if (!result.success) {
    return validationError(c, "Invalid article data", result.error.issues);
  }

  try {
    const article = await createArticle(
      c.get("authenticatedUser"),
      result.data,
    );

    return c.json({ article }, 201);
  } catch (error) {
    return articleError(c, error);
  }
});

articlesRoute.get("/mine", async (c) => {
  const result = articlesPaginationSchema.safeParse(c.req.query());

  if (!result.success) {
    return validationError(
      c,
      "Invalid pagination parameters",
      result.error.issues,
    );
  }

  try {
    const page = await listOwnArticles(
      c.get("authenticatedUser").id,
      result.data,
    );

    return c.json(page);
  } catch (error) {
    return articleError(c, error);
  }
});

articlesRoute.get("/:id", async (c) => {
  try {
    const article = await getArticle(c.req.param("id"));
    return c.json({ article });
  } catch (error) {
    return articleError(c, error);
  }
});

articlesRoute.patch("/:id", async (c) => {
  const body = await c.req.json().catch(() => null);
  const result = updateArticleSchema.safeParse(body);

  if (!result.success) {
    return validationError(c, "Invalid article data", result.error.issues);
  }

  try {
    const article = await updateArticle(
      c.req.param("id"),
      c.get("authenticatedUser").id,
      result.data,
    );

    return c.json({ article });
  } catch (error) {
    return articleError(c, error);
  }
});

articlesRoute.delete("/:id", async (c) => {
  try {
    await deleteArticle(
      c.req.param("id"),
      c.get("authenticatedUser").id,
    );

    return c.body(null, 204);
  } catch (error) {
    return articleError(c, error);
  }
});

export { articlesRoute };
