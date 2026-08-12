import type {
  Article,
  CreateArticleInput,
  PaginatedArticles,
  UpdateArticleInput,
} from "shared";

type ApiErrorResponse = {
  error?: {
    message?: string;
  };
};

const apiUrl = import.meta.env.VITE_API_URL;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    credentials: "include",
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json().catch(() => null)) as
    | ApiErrorResponse
    | T
    | null;

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? payload.error?.message
        : undefined;
    throw new Error(message ?? "The request could not be completed.");
  }

  return payload as T;
}

export function getOwnArticles(page: number) {
  return request<PaginatedArticles>(`/api/articles/mine?page=${page}&limit=10`);
}

export async function getArticle(articleId: string) {
  const response = await request<{ article: Article }>(
    `/api/articles/${encodeURIComponent(articleId)}`,
  );
  return response.article;
}

export async function createArticle(input: CreateArticleInput) {
  const response = await request<{ article: Article }>("/api/articles", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.article;
}

export async function updateArticle(
  articleId: string,
  input: UpdateArticleInput,
) {
  const response = await request<{ article: Article }>(
    `/api/articles/${encodeURIComponent(articleId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
  return response.article;
}

export function deleteArticle(articleId: string) {
  return request<void>(`/api/articles/${encodeURIComponent(articleId)}`, {
    method: "DELETE",
  });
}
