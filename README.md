# StockNote 股票复盘管理系统

股票交易年度/月度/每日复盘记录工具，支持从同花顺导入交易数据。

## 功能特性

- **年度总结** - 显示全年收益汇总、月度收益对比图表、多年度对比
- **月度分析** - 月度收益表格、自定义日历视图、涨停/跌停记录
- **每日复盘** - 每日操作记录、仓位管理、交易计划
- **同花顺数据导入** - 一键获取平仓记录、每日盈亏数据
- **隐私保护** - 一键隐藏/显示金额

## 快速开始

```bash
# 启动后端服务
node server/server.js 9998

# 访问前端
http://localhost:9998/html/index.html
```

## 同花顺数据导入配置

### 获取凭证步骤

1. 登录同花顺投资账本：https://tzzb.10jqka.com.cn/

2. 获取 UserId（用户ID）
   - 登录后，按 F12 打开开发者工具
   - 切换到 Network（网络）标签
   - 刷新页面，点击任意请求
   - 在 Request Headers 或 Query String Parameters 中找到 `userid` 或 `user_id` 的值

3. 获取 FundKey（资金账号）
   - 同样在开发者工具中查找
   - 参数名为 `fund_key` 或 `fundkey`
   - 通常是 8 位数字

4. 获取 Cookie
   - 在开发者工具中切换到 Application（应用）标签
   - 左侧找到 Cookies → https://tzzb.10jqka.com.cn
   - 复制完整的 cookie 字符串
   - **注意：Cookie 有效期较短，过期后需要重新获取**

### 配置方法

1. 点击页面右上角「数据」按钮
2. 在弹窗中依次填写：
   - 用户ID (UserId)
   - 资金账号 (FundKey)
   - Cookie
3. 点击「保存」

> ⚠️ Cookie 有效期较短（约几天），过期后需要重新获取并更新。

## 项目结构

```
├── html/                    # 前端页面
│   ├── index.html           # 年度总结页
│   ├── monthly-analysis.html # 月度分析页
│   └── daily-analysis.html  # 每日复盘页
├── js/                      # 前端逻辑
│   ├── api.js               # API 调用封装
│   ├── indexFuns.js         # 首页功能
│   ├── monthlyFuns.js       # 月度分析
│   ├── dailyFuns.js         # 每日复盘
│   ├── tongHuaShunNoteFuns.js # 同花顺数据获取
│   └── lib/                 # 第三方库
│       ├── vue.min.js       # Vue 3
│       └── echarts.min.js   # 图表库
├── css/                     # 样式文件
├── server/                  # 后端服务
│   ├── server.js            # 主服务（端口 9998）
│   ├── dataManager.js       # JSON 数据存储
│   ├── tongHuaShunNote.js  # 同花顺 API 接口
│   └── holidays.js          # 节假日计算
└── photo/                   # 图片资源
    └── ico/                 # 图标文件
```

## 数据存储

| 目录 | 说明 |
|------|------|
| `data/` | JSON 数据文件（年度汇总、月度数据、每日数据）|
| `photo/` | 年度相关图片（涨停图等）|

> ⚠️ 以上目录已加入 `.gitignore`，不会提交到 Git

## 页面说明

| 页面 | 路径 | 说明 |
|------|------|------|
| 年度总结 | `/html/index.html` | 全年收益汇总、月份卡片、收益走势图 |
| 月度分析 | `/html/monthly-analysis.html` | 月度表格、日历视图、同花顺数据导入 |
| 每日复盘 | `/html/daily-analysis.html` | 每日操作记录、持仓管理、交易计划 |

## 技术栈

- **前端**：HTML5 + Vue 3 + ECharts
- **后端**：Node.js

## 许可证

MIT
