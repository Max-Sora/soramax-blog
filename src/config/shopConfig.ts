import type { ShopConfig } from "@/types/shopConfig";

export const shopConfig: ShopConfig = {
	enabled: true,
	name: "SoraMax Shop",
	tagline: "Small-batch gear, imports, and interesting finds.",
	description:
		"Hard-to-find racket-sport gear, selected imports, and official goods.",
	featuredLimit: 3,
	contactEmail: "contact@soramax.xyz",
	contactPhone: "+16266576525",
	contactPhoneDisplay: "626-657-6525",
	contactEmailUrl:
		"mailto:contact@soramax.xyz?subject=SoraMax%20Shop%20Inquiry",
	contactSmsUrl: "sms:+16266576525",
	categories: [
		{
			id: "table-tennis",
			label: "Table Tennis",
			icon: "material-symbols:sports-tennis",
		},
		{
			id: "badminton",
			label: "Badminton",
			icon: "mdi:badminton",
		},
		{
			id: "anime-goods",
			label: "Anime Goods",
			icon: "material-symbols:smart-toy",
		},
		{
			id: "course-codes",
			label: "Course Codes",
			icon: "material-symbols:school",
		},
		{
			id: "other",
			label: "Other Finds",
			icon: "material-symbols:explore",
		},
	],
};
