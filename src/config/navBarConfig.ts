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
		LinkPresets.CareerNavigator,
		LinkPresets.Shop,
		LinkPresets.About,
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
	Shop: {
		name: "Shop",
		url: "/shop/",
		icon: "material-symbols:shopping-bag",
		highlight: true,
		highlightVariant: "shop",
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
	CareerNavigator: {
		name: "Career Navigator",
		url: "/tools/career-navigator/",
		icon: "material-symbols:route",
		highlight: true,
		highlightVariant: "career",
	},
	About: {
		name: "About",
		url: "/about/",
		icon: "material-symbols:person",
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
