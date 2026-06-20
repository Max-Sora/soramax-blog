import type { BackgroundWallpaperConfig } from "@/types/backgroundWallpaper";

export const backgroundWallpaper: BackgroundWallpaperConfig = {
	mode: "none",
	switchable: false,
	src: {
		desktop: [
			"assets/images/DesktopWallpaper/d1.avif",
			"assets/images/DesktopWallpaper/d2.avif",
			"assets/images/DesktopWallpaper/d3.avif",
			"assets/images/DesktopWallpaper/d4.avif",
			"assets/images/DesktopWallpaper/d5.avif",
			"assets/images/DesktopWallpaper/d6.avif",
		],
		mobile: [
			"assets/images/MobileWallpaper/m1.avif",
			"assets/images/MobileWallpaper/m2.avif",
			"assets/images/MobileWallpaper/m3.avif",
			"assets/images/MobileWallpaper/m4.avif",
			"assets/images/MobileWallpaper/m5.avif",
			"assets/images/MobileWallpaper/m6.avif",
		],
	},
	common: {
		dimOpacity: 0.2,
		homeText: {
			enable: true,
			switchable: false,
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
	banner: {
		position: "0% 20%",
		carousel: {
			enable: false,
			interval: 5000,
			switchable: false,
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
