export type ShopProductStatus =
	| "in-stock"
	| "low-stock"
	| "sold-out"
	| "coming-soon";

export type ShopProductCondition = "new" | "open-box" | "used";

export type ShopCategory = {
	id: string;
	label: string;
	icon: string;
};

export type ShopConfig = {
	enabled: boolean;
	name: string;
	tagline: string;
	description: string;
	featuredLimit: number;
	categories: ShopCategory[];
	contactUrl: string;
};
