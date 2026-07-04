import type { BackgroundWallpaperConfig } from "@/types/backgroundWallpaper";

export const backgroundWallpaper: BackgroundWallpaperConfig = {
	mode: "none",
	switchable: false,
	playerEnable: false,
	src: {
		desktop: [],
		mobile: [],
	},
	common: {
		dimOpacity: 0.2,
		homeText: {
			enable: false,
			title: "Hi, I'm Max.",
			subtitle: ["Hardware, servers, AI tools, and engineering notes."],
			titleSize: "3.8rem",
			subtitleSize: "1.5rem",
			typewriter: {
				enable: false,
				speed: 100,
				deleteSpeed: 50,
				pauseTime: 2000,
			},
		},
		navbar: {
			transparentMode: "semi",
			enableBlur: true,
			blur: 5,
		},
	},
	overlay: {
		switchable: {
			opacity: false,
			blur: false,
			cardOpacity: false,
		},
		zIndex: -1,
		opacity: 0.8,
		blur: 10,
		cardOpacity: 0.5,
	},
	fullscreen: {
		position: "center",
	},
};
