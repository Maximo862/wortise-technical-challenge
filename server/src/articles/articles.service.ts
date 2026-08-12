import type {
  Article,
  ArticlesPaginationInput,
  CreateArticleInput,
  PaginatedArticles,
  PublicArticleSearchInput,
  PublicAuthor,
  UpdateArticleInput,
} from "shared";
import { ObjectId } from "mongodb";
import {
  articleExists,
  createArticleRecord,
  deleteArticleByOwner,
  findArticleById,
  findArticlesByAuthor,
  findPublicAuthors,
  searchPublicArticles,
  updateArticleByOwner,
  type ArticleChanges,
} from "./articles.repository";

type ArticleErrorCode =
  | "INVALID_ARTICLE_ID"
  | "ARTICLE_NOT_FOUND"
  | "ARTICLE_FORBIDDEN";

type ArticleErrorStatus = 400 | 403 | 404;

export class ArticleServiceError extends Error {
  constructor(
    public readonly code: ArticleErrorCode,
    public readonly status: ArticleErrorStatus,
    message: string,
  ) {
    super(message);
    this.name = "ArticleServiceError";
  }
}

type ArticleAuthor = {
  id: string;
  name: string;
};

function parseArticleId(id: string): ObjectId {
  if (!ObjectId.isValid(id)) {
    throw new ArticleServiceError(
      "INVALID_ARTICLE_ID",
      400,
      "Invalid article id",
    );
  }

  return new ObjectId(id);
}

export async function createArticle(
  author: ArticleAuthor,
  input: CreateArticleInput,
): Promise<Article> {
  return createArticleRecord({
    title: input.title,
    content: input.content,
    coverImageUrl: input.coverImageUrl || undefined,
    authorId: author.id,
    authorName: author.name,
  });
}

export async function listOwnArticles(
  authorId: string,
  pagination: ArticlesPaginationInput,
): Promise<PaginatedArticles> {
  return findArticlesByAuthor(authorId, pagination.page, pagination.limit);
}

export function listPublicAuthors(): Promise<PublicAuthor[]> {
  return findPublicAuthors();
}

export function searchArticles(
  input: PublicArticleSearchInput,
): Promise<PaginatedArticles> {
  return searchPublicArticles(
    input.q,
    input.page,
    input.limit,
  );
}

export async function getArticle(id: string): Promise<Article> {
  const article = await findArticleById(parseArticleId(id));

  if (!article) {
    throw new ArticleServiceError(
      "ARTICLE_NOT_FOUND",
      404,
      "Article not found",
    );
  }

  return article;
}

export async function updateArticle(
  id: string,
  authorId: string,
  input: UpdateArticleInput,
): Promise<Article> {
  const articleId = parseArticleId(id);
  const changes: ArticleChanges = {};

  if (input.title !== undefined) {
    changes.title = input.title;
  }

  if (input.content !== undefined) {
    changes.content = input.content;
  }

  if ("coverImageUrl" in input) {
    changes.coverImageUrl = input.coverImageUrl || null;
  }

  const article = await updateArticleByOwner(articleId, authorId, changes);

  if (article) {
    return article;
  }

  if (!(await articleExists(articleId))) {
    throw new ArticleServiceError(
      "ARTICLE_NOT_FOUND",
      404,
      "Article not found",
    );
  }

  throw new ArticleServiceError(
    "ARTICLE_FORBIDDEN",
    403,
    "You can only edit your own articles",
  );
}

export async function deleteArticle(
  id: string,
  authorId: string,
): Promise<void> {
  const articleId = parseArticleId(id);
  const deleted = await deleteArticleByOwner(articleId, authorId);

  if (deleted) {
    return;
  }

  if (!(await articleExists(articleId))) {
    throw new ArticleServiceError(
      "ARTICLE_NOT_FOUND",
      404,
      "Article not found",
    );
  }

  throw new ArticleServiceError(
    "ARTICLE_FORBIDDEN",
    403,
    "You can only delete your own articles",
  );
}
