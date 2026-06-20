import type { SiteConfig } from "@/types/siteConfig";

const SITE_LANG = "en";

export const siteConfig: SiteConfig = {
	// 站点标题
	title: "Max",
	// 副标题
	subtitle: "Hardware, servers, AI tools, and engineering notes.",
	// 站点 URL
	site_url: "https://soramax.xyz",
	// 站点描述
	description: "Max's English personal blog about hardware, servers, embedded systems, AI workflows, and PC building.",
	keywords: [
		"Max",
		"Hardware",
		"Servers",
		"AI Tools",
		"Embedded Systems",
		"PC Building",
		"Minecraft",
	],
	lang: SITE_LANG,

	themeColor: {
		hue: 165,
		fixed: false,
		defaultMode: "system",
	},

	pageWidth: 100,

	card: {
		border: true,
		followTheme: false,
	},

	favicon: [
		{
			src: "/favicon/favicon.ico",
		},
	],

	navbar: {
		logo: {
			type: "image",
			value: "assets/images/firefly.png",
			alt: "Max",
		},
		title: "Max",
		widthFull: false,
		menuAlign: "center",
		followTheme: false,
		stickyNavbar: true,
	},

	siteStartDate: "2025-01-01",
	timezone: "America/Los_Angeles",

	pages: {
		friends: true,
		sponsor: true,
		guestbook: true,
		bangumi: true,
		gallery: true,
	},

	categoryBar: true,
	foldArticle: true,

	postListLayout: {
		defaultMode: "list",
		mobileDefaultMode: "list",
		showTags: true,
		descriptionLines: 2,
		allowSwitch: true,
		grid: {
			masonry: false,
			columnWidth: 320,
		},
	},

	post: {
		rehypeCallouts: {
			theme: "github",
			enablePythonMarkdownAdmonitions: false,
		},
		showLastModified: true,
		outdatedThreshold: 30,
		sharePoster: true,
		generateOgImages: false,
	},

	bangumi: {
		userId: "1143164",
		mode: "dynamic",
		apiUrl: "https://api.bangumi.one",
		subjectBaseUrl: "https://bangumi.one/subject/",
		categoryOrder: ["anime", "book", "music", "game"],
	},

	pagination: {
		postsPerPage: 10,
	},

	imageOptimization: {
		formats: "webp",
		quality: 85,
		noReferrerDomains: [],
	},
};
