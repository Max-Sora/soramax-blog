# EE Intelligence Demo 操作说明

打开 SoraMax 的 `/tools/ee-intelligence/`。

1. 在 **Event Intelligence** 中搜索 `thermal` 或 `controller`。列表会显示去重后的事件簇、重要度和不确定性。
2. 点击事件卡，查看 Evidence ledger 和 Sources。正向、反向、混合证据会分别标注，来源链接会显示 `SIMULATED`。
3. 切换 **Signal Lab**，调整最低重要度、交易成本和持有 bar 数。Trade ledger 会显示 signal、entry、exit、方向和扣除成本后的净值。
4. 切换 **Method & Limits**，查看 SQLite/FTS5、采集器、模型判断和回测的边界。

页面顶部的公开 Demo 提示必须保留。页面使用合成标题、来源和价格，不公开私有数据库，不连接真实自动交易，也不能把回测数字当成已验证的收益策略。
