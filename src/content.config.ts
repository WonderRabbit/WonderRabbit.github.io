import { defineCollection } from "astro:content"
import { glob } from "astro/loaders"
import { z } from "astro/zod"

const sourceSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  accessed: z.coerce.date(),
})

const posts = defineCollection({
  loader: glob({ base: "./src/content/posts", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    published: z.coerce.date(),
    updated: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    category: z.string().min(1),
    tags: z.array(z.string().min(1)).min(1),
    aiAssisted: z.boolean(),
    sources: z.array(sourceSchema).min(1),
  }),
})

const pages = defineCollection({
  loader: glob({ base: "./src/content/pages", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    updated: z.coerce.date(),
    draft: z.boolean().default(false),
  }),
})

export const collections = { posts, pages }
