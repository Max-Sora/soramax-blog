import type { ProfileConfig } from "../types/profileConfig";

export const profileConfig: ProfileConfig = {
	avatar: "assets/images/avatar.avif",
	name: "Max",
	bio: "UCI transfer student interested in hardware, servers, embedded systems, AI workflows, and PC building.",
	links: [
		{
			name: "Website",
			icon: "material-symbols:language",
			url: "https://soramax.xyz",
			showName: false,
		},
		{
			name: "GitHub",
			icon: "fa7-brands:github",
			url: "https://github.com/Max-Sora",
			showName: false,
		},
		{
			name: "Email",
			icon: "fa7-solid:envelope",
			url: "mailto:maxxtang@qq.com",
			showName: false,
		},
	],
};
