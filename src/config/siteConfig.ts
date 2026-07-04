import type { SiteConfig } from "@/types/siteConfig";

const SITE_LANG = "en";

export const siteConfig: SiteConfig = {
	// Site title
	title: "Max",
	// Site subtitle
	subtitle: "Hardware, servers, AI tools, and engineering notes.",
	// Site URL
	site_url: "https://soramax.xyz",
	// Site description
	description:
		"Max's English personal blog about hardware, servers, embedded systems, AI workflows, and PC building.",
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
		// Enable anime page
		anime: true,
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
		apiUrl: "https://bgmapi.anibt.net",
		subjectBaseUrl: "https://bgmmi.anibt.net/subject/",
		categoryOrder: ["anime", "book", "music", "game"],
	},
	anime: {
		bilibili: {
			uid: "38932988",
		},
	},

	pagination: {
		postsPerPage: 10,
	},

	imageOptimization: {
		formats: "webp",
		quality: 85,
		noReferrerDomains: ["*.hdslb.com", "*.bilibili.com"],
	},
};
