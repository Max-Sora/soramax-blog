import { type CollectionEntry, getCollection } from "astro:content";
import type { ShopProductStatus } from "@/types/shopConfig";

const statusPriority: Record<ShopProductStatus, number> = {
	"in-stock": 0,
	"low-stock": 1,
	"coming-soon": 2,
	"sold-out": 3,
};

export const sortShopProducts = (
	products: CollectionEntry<"products">[],
): CollectionEntry<"products">[] =>
	[...products].sort((a, b) => {
		if (a.data.featured !== b.data.featured) {
			return a.data.featured ? -1 : 1;
		}

		const statusDifference =
			statusPriority[a.data.status] - statusPriority[b.data.status];
		if (statusDifference !== 0) return statusDifference;

		return a.data.title.localeCompare(b.data.title, "en");
	});

export const getVisibleShopProducts = async () =>
	sortShopProducts(
		(await getCollection("products")).filter(
			(product) => product.data.draft !== true,
		),
	);
