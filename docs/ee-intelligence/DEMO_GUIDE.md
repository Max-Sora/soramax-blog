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
2. 在 **Overview** 查看 Collect → Understand → Connect → Reason / Act 流水线、记录数量、案例数量、最近发现和数据新鲜度。
3. 进入 **Intelligence Feed** 搜索记录并选择一条，查看来源、证据置信度、验证状态和关联案例；再打开 **Case Explorer** 查看症状、硬件、可能原因和排查过程。
4. 进入 **AI Diagnosis** 输入 PC、GPU、CPU 或电子电路故障描述，点击 **Run retrieval diagnosis**。结果来自可复现的案例检索与规则排序，包含证据、原因、步骤和无法确认的内容。
5. 打开 **Agent Monitor** 查看采集、标准化、索引、诊断、导出各阶段的状态、耗时和脱敏日志。微信、B站和 LLM 后端会如实标为未验证或禁用。
6. 在 **Event Intelligence** 中搜索公司名、ticker 或主题。列表展示去重后的事件簇、重要度、新鲜度和不确定性；点击事件卡查看 Evidence ledger 和来源时间线。
7. 切换 **Signal Lab**。Synthetic 模式可立即回放；Live 模式先选择 ticker，再点击 **Load public market bars**。缺少价格数据时结果保持 `insufficient data`。调整费用、滑点、信号延迟和持有 bar 数，查看回撤、交易次数、walk-forward 与基准比较。
8. 切换 **Method & Limits**，查看统一数据契约、SQLite/FTS5、采集器、市场数据和诊断边界。

刷新公开快照：

```bash
pnpm ee-intelligence:sync
pnpm build
```

同步还会生成 `src/data/ee-intelligence/public-snapshot.json`，可通过 `/api/ee-intelligence/public.json` 读取。该文件只包含公开字段白名单和 Synthetic Demo 案例，不发布原始 SQLite。

页面顶部的数据模式提示必须保留。Live 数据来自公开 RSS，Synthetic 使用合成标题、来源和价格；页面不公开私有数据库，不连接真实自动交易，也不能把回测数字当成已验证的收益策略。
