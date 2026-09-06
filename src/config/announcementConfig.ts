import type { AnnouncementConfig } from "../types/announcementConfig";

export const announcementConfig: AnnouncementConfig = {
	// 公告标题
	title: "About This Site",

	// 公告内容
	content:
		"Engineering projects, hardware experiments, embedded systems, technical notes, personal logs, table tennis, and other things I find worth building, testing, or documenting.",

	// 是否允许用户关闭公告
	closable: true,

	link: {
		// 启用链接
		enable: true,
		// 链接文本
		text: "Explore More",
		// 链接 URL
		url: "/about/",
		// 内部链接
		external: false,
	},
};
