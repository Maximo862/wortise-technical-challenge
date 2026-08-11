import type {
  Article,
  PaginatedArticles,
} from "shared";
import {
  ObjectId,
  type Collection,
  type UpdateFilter,
} from "mongodb";
import { getDb } from "../db/client";

type ArticleDocument = {
  _id: ObjectId;
  title: string;
  content: string;
  coverImageUrl?: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateArticleRecord = {
  title: string;
  content: string;
  coverImageUrl?: string;
  authorId: string;
  authorName: string;
};

export type ArticleChanges = {
  title?: string;
  content?: string;
  coverImageUrl?: string | null;
};

function getArticlesCollection(): Collection<ArticleDocument> {
  return getDb().collection<ArticleDocument>("articles");
}

function toArticle(document: ArticleDocument): Article {
  return {
    id: document._id.toHexString(),
    title: document.title,
    content: document.content,
    coverImageUrl: document.coverImageUrl ?? null,
    authorId: document.authorId,
    authorName: document.authorName,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  };
}

export async function createArticleRecord(
  input: CreateArticleRecord,
): Promise<Article> {
  const now = new Date();
  const document: ArticleDocument = {
    _id: new ObjectId(),
    title: input.title,
    content: input.content,
    authorId: input.authorId,
    authorName: input.authorName,
    createdAt: now,
    updatedAt: now,
  };

  if (input.coverImageUrl) {
    document.coverImageUrl = input.coverImageUrl;
  }

  await getArticlesCollection().insertOne(document);

  return toArticle(document);
}

export async function findArticlesByAuthor(
  authorId: string,
  page: number,
  limit: number,
): Promise<PaginatedArticles> {
  const collection = getArticlesCollection();
  const filter = { authorId };
  const skip = (page - 1) * limit;

  const [documents, total] = await Promise.all([
    collection
      .find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    collection.countDocuments(filter),
  ]);

  return {
    articles: documents.map(toArticle),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function findArticleById(
  articleId: ObjectId,
): Promise<Article | null> {
  const document = await getArticlesCollection().findOne({ _id: articleId });
  return document ? toArticle(document) : null;
}

export async function articleExists(articleId: ObjectId): Promise<boolean> {
  const document = await getArticlesCollection().findOne(
    { _id: articleId },
    { projection: { _id: 1 } },
  );

  return document !== null;
}

export async function updateArticleByOwner(
  articleId: ObjectId,
  authorId: string,
  changes: ArticleChanges,
): Promise<Article | null> {
  const setFields: Partial<ArticleDocument> = {
    updatedAt: new Date(),
  };
  const update: UpdateFilter<ArticleDocument> = {
    $set: setFields,
  };

  if (changes.title !== undefined) {
    setFields.title = changes.title;
  }

  if (changes.content !== undefined) {
    setFields.content = changes.content;
  }

  if ("coverImageUrl" in changes) {
    if (changes.coverImageUrl) {
      setFields.coverImageUrl = changes.coverImageUrl;
    } else {
      update.$unset = { coverImageUrl: "" };
    }
  }

  const document = await getArticlesCollection().findOneAndUpdate(
    { _id: articleId, authorId },
    update,
    { returnDocument: "after" },
  );

  return document ? toArticle(document) : null;
}

export async function deleteArticleByOwner(
  articleId: ObjectId,
  authorId: string,
): Promise<boolean> {
  const result = await getArticlesCollection().deleteOne({
    _id: articleId,
    authorId,
  });

  return result.deletedCount === 1;
}
