# EE Intelligence Demo 操作说明

打开 SoraMax 的 `/tools/ee-intelligence/`。

本地启动：

```bash
pnpm install
pnpm ee-intelligence:sync
pnpm dev --host 127.0.0.1 --port 4321
```

部署静态站点前先运行 `pnpm ee-intelligence:sync`，再运行 `pnpm build`。同步脚本只访问下方文档列出的公开 RSS，并把结果写入静态 Live 快照；部署环境没有网络时会保留上一份缓存或明确返回 unavailable。

1. 先选择 **Live public RSS** 或 **Synthetic fixture**。Live 失败会显示错误，不会静默换成模拟数据。
2. 在 **Event Intelligence** 中搜索公司名、ticker 或主题。列表展示去重后的事件簇、重要度、新鲜度和不确定性。
3. 点击事件卡，查看 Evidence ledger、事实/推断/未知因素、相关股票和来源时间线。
4. 切换 **Signal Lab**。Synthetic 模式可立即回放；Live 模式先选择 ticker，再点击 **Load public market bars**。缺少价格数据时结果保持 `insufficient data`。
5. 调整费用、滑点、信号延迟和持有 bar 数，查看收益、回撤、胜率、交易次数、walk-forward 与基准比较。
6. 切换 **Method & Limits**，查看 SQLite/FTS5、采集器、市场数据和信号解释的边界。

刷新公开快照：

```bash
pnpm ee-intelligence:sync
pnpm build
```

页面顶部的数据模式提示必须保留。Live 数据来自公开 RSS，Synthetic 使用合成标题、来源和价格；页面不公开私有数据库，不连接真实自动交易，也不能把回测数字当成已验证的收益策略。
