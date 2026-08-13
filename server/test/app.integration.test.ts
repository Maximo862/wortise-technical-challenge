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
import type { Article } from "shared";
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

  const setCookie = response.headers.get("set-cookie");
  expect(setCookie).toBeTruthy();

  return setCookie!.split(";")[0];
}

async function createTestArticle(
  cookie: string,
  title = "Original title",
): Promise<Article> {
  const response = await app.request("/api/articles", {
    method: "POST",
    headers: requestHeaders(cookie),
    body: JSON.stringify({
      title,
      content: "Original article content",
      coverImageUrl: "",
    }),
  });

  expect(response.status).toBe(201);

  const body = (await response.json()) as { article: Article };
  return body.article;
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
