import type { MusicPlayerConfig } from "../types/musicConfig";

const neteasePlaylist = [
	// Classic / older tracks
	{ title: "Misty Memory (Night Version)", id: 2070351310 },
	{ title: "秋绪 (伴奏版)", id: 1811703834 },
	{ title: "Misty Memory (Day Version)", id: 2070352215 },
	{ title: "生命流", id: 1371757760 },
	{ title: "泛用型自动化解决方案0.3.2.9f2", id: 1371757759 },
	{ title: "兔兔在哪里？ (Instrumental)", id: 2013932217 },

	// 2024+
	{ title: "Winged Step", id: 2114750011 },
	{ title: "Warm and Small Light", id: 2603903847 },
	{ title: "Tranquil Snow", id: 2659584604 },

	// 2025
	{ title: "烛影暖", id: 2667701653 },
	{ title: "滋味常", id: 2668038573 },
	{ title: "Summer Fizz Pop", id: 2728405343 },
	{ title: "Little Wish", id: 2731325796 },
	{ title: "Paper Boat", id: 2755406555 },
	{ title: "The Walk", id: 3312932682 },
	{ title: "Follow Your Heart", id: 3312937331 },
	{ title: "Slowly Flow, Hearthlight Glow", id: 3332141362 },

	// 2026
	{ title: "夏日远去之后", id: 3390243136 },
];

// 音乐播放器配置
export const musicPlayerConfig: MusicPlayerConfig = {
	// 禁用音乐播放器方法：
	// 模板默认侧边栏和导航栏两个都显示
	// 1. 侧边栏：在sidebarConfig.ts侧边栏配置把音乐组件enable设为false禁用即可
	// 2. 导航栏：在本配置文件把showInNavbar设为false禁用即可

	// 是否在导航栏显示音乐播放器入口
	showInNavbar: true,

	// 使用方式："meting" 使用 Meting API，"local" 使用本地音乐列表
	mode: "meting",

	// 默认音量 (0-1)
	volume: 0.7,

	// 播放模式：'list'=列表循环, 'one'=单曲循环, 'random'=随机播放
	playMode: "list",

	// 是否显启用歌词
	showLyrics: true,

	// Meting API 配置
	meting: {
		// Meting API 地址
		// 默认使用官方 API，也可以使用自定义 API
		api: "https://api.injahow.cn/meting/?server=:server&type=:type&id=:id",
		// 音乐平台：netease=网易云音乐, tencent=QQ音乐, kugou=酷狗音乐, xiami=虾米音乐, baidu=百度音乐
		server: "netease",
		// 类型：song=单曲, playlist=歌单, album=专辑, search=搜索, artist=艺术家
		type: "song",
		// 歌单/专辑/单曲 ID 或搜索关键词
		id: "2070351310",
		// 认证 token（可选）
		auth: "",
		// 备用 API 配置（当主 API 失败时使用）
		fallbackApis: [
			"https://api.i-meto.com/meting/api?server=:server&type=:type&id=:id&r=:r",
			"https://api.moeyao.cn/meting/?server=:server&type=:type&id=:id",
		],
		playlist: neteasePlaylist,
	},

	// 本地音乐配置（当 mode 为 'local' 时使用）
	// 1. 支持传入歌词文件的路径
	// lrc: "/assets/music/lrc/使一颗心免于哀伤-哼唱.lrc",
	// 2. 或者直接填入歌词字符串内容
	// lrc: "[00:00.00]歌词内容...",
	local: {
		playlist: [
			{
				name: "使一颗心免于哀伤",
				artist: "知更鸟 / HOYO-MiX / Chevy",
				url: "/assets/music/使一颗心免于哀伤-哼唱.mp3",
				cover: "/assets/music/cover/109951169585655912.webp",
				lrc: "",
			},
		],
	},
};
