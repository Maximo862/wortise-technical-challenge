import { z } from "zod";

const coverImageUrlSchema = z.union([
  z.url("Enter a valid cover image URL"),
  z.literal(""),
  z.null(),
]);

export const createArticleSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  content: z
    .string()
    .refine((value) => value.trim().length > 0, "Content is required"),
  coverImageUrl: coverImageUrlSchema.optional(),
});

export const updateArticleSchema = createArticleSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const articlesPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const publicArticleSearchSchema = articlesPaginationSchema.extend({
  q: z.string().trim().max(100, "Search must be 100 characters or fewer").default(""),
});

export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
export type ArticlesPaginationInput = z.infer<typeof articlesPaginationSchema>;
export type PublicArticleSearchInput = z.infer<typeof publicArticleSearchSchema>;

export type PublicAuthor = { id: string; name: string; articleCount: number };

export type Article = {
  id: string;
  title: string;
  content: string;
  coverImageUrl: string | null;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedArticles = {
  articles: Article[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
