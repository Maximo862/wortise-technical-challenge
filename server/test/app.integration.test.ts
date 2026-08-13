import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import type { Db, MongoClient } from "mongodb";
import type { Article, PaginatedArticles, PublicAuthor } from "shared";
import type { App } from "../src/app";

const TEST_ORIGIN = "http://localhost:5173";
const VALID_ARTICLE_ID = "507f1f77bcf86cd799439011";

type ErrorResponse = {
  error: {
    code: string;
    message: string;
    issues?: Array<{ field: string; message: string }>;
  };
};

let mongo: MongoMemoryReplSet;
let mongoClient: MongoClient;
let db: Db;
let app: App;

function requestHeaders(cookie?: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Origin: TEST_ORIGIN,
    ...(cookie ? { Cookie: cookie } : {}),
  };
}

function getSessionCookie(response: Response): string {
  const setCookie = response.headers.get("set-cookie");
  expect(setCookie).toBeTruthy();

  return setCookie!.split(";")[0];
}

async function registerUser(name: string, email: string): Promise<string> {
  const response = await app.request("/api/auth/sign-up/email", {
    method: "POST",
    headers: requestHeaders(),
    body: JSON.stringify({
      name,
      email,
      password: "password123",
    }),
  });

  expect(response.status).toBe(200);

  return getSessionCookie(response);
}

async function loginUser(
  email: string,
  password = "password123",
): Promise<string> {
  const response = await app.request("/api/auth/sign-in/email", {
    method: "POST",
    headers: requestHeaders(),
    body: JSON.stringify({ email, password }),
  });

  expect(response.status).toBe(200);

  return getSessionCookie(response);
}

async function createTestArticle(
  cookie: string,
  title = "Original title",
  content = "Original article content",
): Promise<Article> {
  const response = await app.request("/api/articles", {
    method: "POST",
    headers: requestHeaders(cookie),
    body: JSON.stringify({
      title,
      content,
      coverImageUrl: "",
    }),
  });

  expect(response.status).toBe(201);

  const body = (await response.json()) as { article: Article };
  return body.article;
}

async function searchPublicArticles(
  query: string,
  page = 1,
  limit = 10,
): Promise<PaginatedArticles> {
  const searchParams = new URLSearchParams({
    q: query,
    page: String(page),
    limit: String(limit),
  });
  const response = await app.request(
    `/api/public/search?${searchParams.toString()}`,
  );

  expect(response.status).toBe(200);
  return (await response.json()) as PaginatedArticles;
}

beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create({
    binary: {
      version: process.env.MONGOMS_VERSION ?? "8.2.6",
    },
    instanceOpts: [{ launchTimeout: 60_000 }],
    replSet: {
      count: 1,
      storageEngine: "wiredTiger",
    },
  });

  process.env.MONGODB_URI = mongo.getUri();
  process.env.MONGODB_DB_NAME = "wortise_test";
  process.env.BETTER_AUTH_SECRET =
    "integration-test-secret-that-is-not-used-in-production";
  process.env.BETTER_AUTH_URL = "http://localhost:3000";
  process.env.CLIENT_ORIGIN = TEST_ORIGIN;

  const databaseModule = await import("../src/db/client");
  const { createAuth } = await import("../src/auth/auth");
  const { createApp } = await import("../src/app");

  db = await databaseModule.connectToDatabase();
  mongoClient = databaseModule.getMongoClient();
  app = createApp(createAuth(db, mongoClient), TEST_ORIGIN);
}, 300_000);

beforeEach(async () => {
  await db.dropDatabase();
});

afterAll(async () => {
  await mongoClient?.close();
  await mongo?.stop();
});

describe("articles API security and validation", () => {
  it("rejects unauthenticated requests to every private article endpoint", async () => {
    const requests: Array<{ path: string; init: RequestInit }> = [
      {
        path: "/api/articles",
        init: {
          method: "POST",
          headers: requestHeaders(),
          body: JSON.stringify({
            title: "Valid title",
            content: "Valid content",
          }),
        },
      },
      {
        path: "/api/articles/mine",
        init: { method: "GET", headers: requestHeaders() },
      },
      {
        path: `/api/articles/${VALID_ARTICLE_ID}`,
        init: { method: "GET", headers: requestHeaders() },
      },
      {
        path: `/api/articles/${VALID_ARTICLE_ID}`,
        init: {
          method: "PATCH",
          headers: requestHeaders(),
          body: JSON.stringify({ title: "Updated title" }),
        },
      },
      {
        path: `/api/articles/${VALID_ARTICLE_ID}`,
        init: { method: "DELETE", headers: requestHeaders() },
      },
    ];

    for (const request of requests) {
      const response = await app.request(request.path, request.init);
      const body = (await response.json()) as ErrorResponse;

      expect(response.status).toBe(401);
      expect(body.error).toMatchObject({
        code: "UNAUTHORIZED",
        message: "Authentication is required",
      });
    }
  });

  it("prevents a user from editing another user's article", async () => {
    const ownerCookie = await registerUser(
      "Article Owner",
      "owner-edit@example.com",
    );
    const otherUserCookie = await registerUser(
      "Other User",
      "other-edit@example.com",
    );
    const article = await createTestArticle(ownerCookie);

    const response = await app.request(
      `/api/articles/${article.id}`,
      {
        method: "PATCH",
        headers: requestHeaders(otherUserCookie),
        body: JSON.stringify({ title: "Unauthorized update" }),
      },
    );
    const errorBody = (await response.json()) as ErrorResponse;

    expect(response.status).toBe(403);
    expect(errorBody.error.code).toBe("ARTICLE_FORBIDDEN");

    const detailResponse = await app.request(
      `/api/articles/${article.id}`,
      { headers: requestHeaders(ownerCookie) },
    );
    const detailBody = (await detailResponse.json()) as {
      article: Article;
    };

    expect(detailResponse.status).toBe(200);
    expect(detailBody.article.title).toBe("Original title");
  });

  it("prevents a user from deleting another user's article", async () => {
    const ownerCookie = await registerUser(
      "Article Owner",
      "owner-delete@example.com",
    );
    const otherUserCookie = await registerUser(
      "Other User",
      "other-delete@example.com",
    );
    const article = await createTestArticle(ownerCookie);

    const response = await app.request(
      `/api/articles/${article.id}`,
      {
        method: "DELETE",
        headers: requestHeaders(otherUserCookie),
      },
    );
    const errorBody = (await response.json()) as ErrorResponse;

    expect(response.status).toBe(403);
    expect(errorBody.error.code).toBe("ARTICLE_FORBIDDEN");

    const detailResponse = await app.request(
      `/api/articles/${article.id}`,
      { headers: requestHeaders(ownerCookie) },
    );

    expect(detailResponse.status).toBe(200);
  });

  it("rejects invalid data when creating an article", async () => {
    const cookie = await registerUser(
      "Validation User",
      "invalid-create@example.com",
    );

    const response = await app.request("/api/articles", {
      method: "POST",
      headers: requestHeaders(cookie),
      body: JSON.stringify({ title: "   ", content: "" }),
    });
    const body = (await response.json()) as ErrorResponse;
    const invalidFields = body.error.issues?.map((issue) => issue.field);

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.message).toBe("Invalid article data");
    expect(invalidFields).toEqual(expect.arrayContaining(["title", "content"]));
  });

  it("rejects an empty update", async () => {
    const cookie = await registerUser(
      "Validation User",
      "invalid-update@example.com",
    );
    const article = await createTestArticle(cookie);

    const response = await app.request(
      `/api/articles/${article.id}`,
      {
        method: "PATCH",
        headers: requestHeaders(cookie),
        body: JSON.stringify({}),
      },
    );
    const body = (await response.json()) as ErrorResponse;

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.message).toBe("Invalid article data");
    expect(body.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: "At least one field is required",
        }),
      ]),
    );
  });
});

describe("public articles API", () => {
  it("searches articles by title, content and author name", async () => {
    const titleCookie = await registerUser(
      "Title Writer",
      "title-search@example.com",
    );
    const contentCookie = await registerUser(
      "Content Writer",
      "content-search@example.com",
    );
    const authorCookie = await registerUser(
      "Aurora Author",
      "author-search@example.com",
    );

    const titleArticle = await createTestArticle(
      titleCookie,
      "Nebula field report",
      "A general astronomy article",
    );
    const contentArticle = await createTestArticle(
      contentCookie,
      "Navigation notes",
      "Instructions for using a quartz compass",
    );
    const authorArticle = await createTestArticle(
      authorCookie,
      "Northern observations",
      "Notes collected during winter",
    );

    const titleResults = await searchPublicArticles("nebula");
    const contentResults = await searchPublicArticles("QUARTZ COMPASS");
    const authorResults = await searchPublicArticles("aurora author");

    expect(titleResults.articles.map((article) => article.id)).toEqual([
      titleArticle.id,
    ]);
    expect(contentResults.articles.map((article) => article.id)).toEqual([
      contentArticle.id,
    ]);
    expect(authorResults.articles.map((article) => article.id)).toEqual([
      authorArticle.id,
    ]);
  });

  it("paginates public results and calculates totals correctly", async () => {
    const cookie = await registerUser(
      "Pagination Author",
      "pagination@example.com",
    );

    for (let index = 1; index <= 5; index += 1) {
      await createTestArticle(cookie, `Article ${index}`);
    }

    const firstPage = await searchPublicArticles("", 1, 2);
    const secondPage = await searchPublicArticles("", 2, 2);
    const thirdPage = await searchPublicArticles("", 3, 2);
    const articleIds = [
      ...firstPage.articles,
      ...secondPage.articles,
      ...thirdPage.articles,
    ].map((article) => article.id);

    expect(firstPage.articles).toHaveLength(2);
    expect(secondPage.articles).toHaveLength(2);
    expect(thirdPage.articles).toHaveLength(1);
    expect(firstPage.pagination).toEqual({
      page: 1,
      limit: 2,
      total: 5,
      totalPages: 3,
    });
    expect(secondPage.pagination.page).toBe(2);
    expect(thirdPage.pagination.page).toBe(3);
    expect(new Set(articleIds).size).toBe(5);
  });

  it("includes authors without articles and returns correct article counts", async () => {
    await registerUser("New Author", "new-author@example.com");
    const publishingCookie = await registerUser(
      "Publishing Author",
      "publishing-author@example.com",
    );
    await createTestArticle(publishingCookie, "First publication");
    await createTestArticle(publishingCookie, "Second publication");

    const response = await app.request("/api/public/authors");
    const body = (await response.json()) as { authors: PublicAuthor[] };
    const newAuthor = body.authors.find(
      (author) => author.name === "New Author",
    );
    const publishingAuthor = body.authors.find(
      (author) => author.name === "Publishing Author",
    );

    expect(response.status).toBe(200);
    expect(newAuthor?.articleCount).toBe(0);
    expect(publishingAuthor?.articleCount).toBe(2);
  });
});

describe("critical article flow", () => {
  it("registers, logs in, creates, views, edits and deletes an article", async () => {
    const email = "critical-flow@example.com";
    await registerUser("Critical Flow User", email);
    const cookie = await loginUser(email);

    const createdArticle = await createTestArticle(
      cookie,
      "Initial flow title",
      "Initial flow content",
    );

    const detailResponse = await app.request(
      `/api/articles/${createdArticle.id}`,
      { headers: requestHeaders(cookie) },
    );
    const detailBody = (await detailResponse.json()) as {
      article: Article;
    };

    expect(detailResponse.status).toBe(200);
    expect(detailBody.article).toMatchObject({
      id: createdArticle.id,
      title: "Initial flow title",
      content: "Initial flow content",
    });

    const updateResponse = await app.request(
      `/api/articles/${createdArticle.id}`,
      {
        method: "PATCH",
        headers: requestHeaders(cookie),
        body: JSON.stringify({
          title: "Updated flow title",
          content: "Updated flow content",
        }),
      },
    );
    const updateBody = (await updateResponse.json()) as {
      article: Article;
    };

    expect(updateResponse.status).toBe(200);
    expect(updateBody.article).toMatchObject({
      id: createdArticle.id,
      title: "Updated flow title",
      content: "Updated flow content",
    });

    const deleteResponse = await app.request(
      `/api/articles/${createdArticle.id}`,
      {
        method: "DELETE",
        headers: requestHeaders(cookie),
      },
    );

    expect(deleteResponse.status).toBe(204);

    const deletedDetailResponse = await app.request(
      `/api/articles/${createdArticle.id}`,
      { headers: requestHeaders(cookie) },
    );
    const deletedDetailBody =
      (await deletedDetailResponse.json()) as ErrorResponse;

    expect(deletedDetailResponse.status).toBe(404);
    expect(deletedDetailBody.error.code).toBe("ARTICLE_NOT_FOUND");
  });
});
