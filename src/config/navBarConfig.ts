import {
	type NavBarConfig,
	type NavBarLink,
	type NavBarSearchConfig,
	NavBarSearchMethod,
} from "../types/navBarConfig";

const getDynamicNavBarConfig = (): NavBarConfig => {
	const links: NavBarLink[] = [
		LinkPresets.Home,
		LinkPresets.Posts,
		LinkPresets.Projects,
		LinkPresets.HardwareNotes,
		LinkPresets.Services,
		LinkPresets.About,
		LinkPresets.Links,
		LinkPresets.Search,
	];

	return { links } as NavBarConfig;
};

export const navBarSearchConfig: NavBarSearchConfig = {
	method: NavBarSearchMethod.PageFind,
};

export const LinkPresets: Record<string, NavBarLink> = {
	Home: {
		name: "Home",
		url: "/",
		icon: "material-symbols:home",
	},
	Posts: {
		name: "Posts",
		url: "/posts/",
		icon: "material-symbols:article",
	},
	Archive: {
		name: "Archive",
		url: "/archive/",
		icon: "material-symbols:archive",
	},
	Tags: {
		name: "Tags",
		url: "/tags/",
		icon: "material-symbols:tag-rounded",
	},
	Categories: {
		name: "Categories",
		url: "/categories/",
		icon: "material-symbols:folder-open-rounded",
	},
	Projects: {
		name: "Projects",
		url: "/projects/",
		icon: "material-symbols:rocket",
	},
	HardwareNotes: {
		name: "Hardware Notes",
		url: "/hardware-notes/",
		icon: "material-symbols:memory",
	},
	Services: {
		name: "Services",
		url: "/services/",
		icon: "material-symbols:build",
	},
	About: {
		name: "About",
		url: "/about/",
		icon: "material-symbols:person",
	},
	Links: {
		name: "Links",
		url: "#",
		icon: "material-symbols:link",
		children: [
			{
				name: "GitHub",
				url: "https://github.com/Max-Sora",
				external: true,
				icon: "fa7-brands:github",
			},
			{
				name: "GitHub Repo",
				url: "https://github.com/Max-Sora/soramax-blog",
				external: true,
				icon: "fa7-brands:github",
			},
			{
				name: "Website",
				url: "https://soramax.xyz",
				external: true,
				icon: "material-symbols:language",
			},
			{
				name: "Email",
				url: "mailto:maxxtang@qq.com",
				external: true,
				icon: "fa7-solid:envelope",
			},
		],
	},
	Search: {
		name: "Search",
		url: "/search/",
		icon: "material-symbols:search",
	},
	Friends: {
		name: "Friend Links",
		url: "/friends/",
		icon: "material-symbols:group",
		pageKey: "friends",
	},
	Guestbook: {
		name: "Guestbook",
		url: "/guestbook/",
		icon: "material-symbols:chat",
		pageKey: "guestbook",
	},
	Bangumi: {
		name: "Bangumi",
		url: "/bangumi/",
		icon: "material-symbols:movie",
		pageKey: "bangumi",
	},
	Gallery: {
		name: "Gallery",
		url: "/gallery/",
		icon: "material-symbols:photo-library",
		pageKey: "gallery",
	},
	Sponsor: {
		name: "Sponsor",
		url: "/sponsor/",
		icon: "material-symbols:favorite",
		pageKey: "sponsor",
	},
};

export const navBarConfig: NavBarConfig = getDynamicNavBarConfig();
