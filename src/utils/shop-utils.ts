import { type CollectionEntry, getCollection } from "astro:content";
import type { ShopProductStatus } from "@/types/shopConfig";

const statusPriority: Record<ShopProductStatus, number> = {
	"in-stock": 0,
	"low-stock": 1,
	"by-request": 2,
	"coming-soon": 3,
	"sold-out": 4,
};

type ShopPriceData = {
	price?: number;
	priceMin?: number;
	priceMax?: number;
	currency: string;
};

export const formatShopCurrency = (value: number, currency: string) =>
	new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	}).format(value);

export const formatShopPrice = (data: ShopPriceData) => {
	if (typeof data.price === "number") {
		return formatShopCurrency(data.price, data.currency);
	}

	if (typeof data.priceMin === "number" && typeof data.priceMax === "number") {
		return `${formatShopCurrency(data.priceMin, data.currency)} – ${formatShopCurrency(data.priceMax, data.currency)}`;
	}

	if (typeof data.priceMin === "number") {
		return `From ${formatShopCurrency(data.priceMin, data.currency)}`;
	}

	return "Price on request";
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
