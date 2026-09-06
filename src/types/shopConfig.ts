export type ShopProductStatus =
	| "in-stock"
	| "low-stock"
	| "by-request"
	| "sold-out"
	| "coming-soon";

export type ShopProductCondition = "new" | "open-box" | "used";

export type ShopProductType = "physical" | "digital" | "service";

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
	contactEmail: string;
	contactPhone: string;
	contactPhoneDisplay: string;
	contactEmailUrl: string;
	contactSmsUrl: string;
};
