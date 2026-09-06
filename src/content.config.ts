import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const postsCollection = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),
	schema: z.object({
		title: z.string(),
		published: z.date(),
		updated: z.date().optional(),
		draft: z.boolean().optional().default(false),
		description: z.string().optional().default(""),
		image: z.string().optional().default(""),
		tags: z.array(z.string()).optional().default([]),
		category: z.string().optional().nullable().default(""),
		lang: z.string().optional().default(""),
		pinned: z.boolean().optional().default(false),
		author: z.string().optional().default(""),
		sourceLink: z.string().optional().default(""),
		licenseName: z.string().optional().default(""),
		licenseUrl: z.string().optional().default(""),
		comment: z.boolean().optional().default(true),
		password: z.string().optional().default(""),
		passwordHint: z.string().optional().default(""),

		/* For internal use */
		prevTitle: z.string().default(""),
		prevSlug: z.string().default(""),
		nextTitle: z.string().default(""),
		nextSlug: z.string().default(""),
	}),
});

const specCollection = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/spec" }),
	schema: z.object({}),
});

const productsCollection = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/products" }),
	schema: z.object({
		slug: z.string(),
		title: z.string(),
		description: z.string().default(""),
		category: z.string(),
		tags: z.array(z.string()).default([]),
		price: z.number().optional(),
		compareAtPrice: z.number().optional(),
		currency: z.string().default("USD"),
		image: z.string().optional().default(""),
		imageAlt: z.string().optional(),
		featured: z.boolean().default(false),
		draft: z.boolean().default(false),
		status: z
			.enum(["in-stock", "low-stock", "sold-out", "coming-soon"])
			.default("coming-soon"),
		condition: z.enum(["new", "open-box", "used"]).optional(),
		purchaseUrl: z.string().url().optional().nullable(),
		purchaseLabel: z.string().optional(),
		shippingNote: z.string().optional().nullable(),
		sku: z.string().optional(),
	}),
});

export const collections = {
	posts: postsCollection,
	spec: specCollection,
	products: productsCollection,
};
