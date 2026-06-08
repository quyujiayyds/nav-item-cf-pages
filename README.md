# Nav-Item Cloudflare Pages 版

这是基于 [`eooce/nav-item`](https://github.com/eooce/nav-item) 改造的 Cloudflare Pages 版本。

原项目是 **Vue 3 + Express + SQLite**。本仓库已经转换为：

- 前端：Vue 3 + Vite，部署到 **Cloudflare Pages 静态资源**
- 后端 API：**Cloudflare Pages Functions**，路径为 `/api/*`
- 数据库：**Cloudflare D1**
- 后台管理：`/admin`

已去掉原来的 Node/Express 运行依赖，Cloudflare Pages 上可直接部署。

## 在线效果

- Pages 地址：`https://nav-item-cf.pages.dev`
- 后台地址：`https://nav-item-cf.pages.dev/admin`

默认后台账号：

- 用户名：`admin`
- 密码：`123456`

> 部署后建议第一时间进入后台修改默认密码。

## 功能

### 前台

- 导航卡片展示
- 主菜单 / 子菜单分类
- 聚合搜索
- 响应式布局
- 左右广告位展示
- 底部版权：`Copyright © Nav-Item | Powered by one`

### 后台

- 登录认证
- 栏目管理
- 子菜单管理
- 卡片管理
- 广告管理
- 友链管理
- 用户密码修改
- 数据导出 / 导入

### 数据导出 / 导入

后台新增 **数据管理** 页面：

- 支持导出 JSON 备份
- 支持导入 JSON 恢复
- 导入会覆盖：菜单、子菜单、卡片、广告、友链
- 导入不会覆盖：后台用户和密码

## 项目结构

```text
nav-item-cf-pages/
├── functions/
│   └── api/
│       └── [[path]].js          # Cloudflare Pages Functions API
├── migrations/
│   └── 0001_schema_and_seed.sql # D1 数据库结构和默认数据
├── scripts/
│   └── generate-migration.mjs   # 从原始 db.js 生成迁移文件的辅助脚本
├── web/                         # Vue 3 前端
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.mjs
├── worker/                      # Worker 版本入口，保留作参考
├── wrangler.toml                # Cloudflare 配置
├── package.json                 # 根目录脚本和 wrangler 依赖
└── README.md
```

## Cloudflare Pages 部署说明

### 1. Fork 或导入仓库

将本仓库导入到你自己的 GitHub：

```text
https://github.com/saodisengyyds/nav-item-cf-pages
```

### 2. 创建 D1 数据库

本地安装依赖：

```bash
npm install
```

登录 Cloudflare：

```bash
npx wrangler login
```

创建 D1：

```bash
npx wrangler d1 create nav-item-db
```

命令会输出类似：

```toml
[[d1_databases]]
binding = "DB"
database_name = "nav-item-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

把 `database_id` 填入 `wrangler.toml`。

### 3. 初始化 D1 数据

```bash
npx wrangler d1 migrations apply nav-item-db --remote
```

这会创建表并导入默认菜单、子菜单和卡片数据。

### 4. 在 Cloudflare Pages 创建项目

Cloudflare Dashboard：

```text
Workers & Pages → Create application → Pages → Connect to Git
```

选择 GitHub 仓库后，构建配置填写：

| 配置项 | 值 |
| --- | --- |
| Framework preset | `None` 或 `Vue` |
| Build command | `cd web && npm install && npm run build` |
| Build output directory | `web/dist` |
| Root directory | 留空 |

### 5. 绑定 D1 数据库

在 Pages 项目设置里：

```text
Settings → Functions → D1 database bindings
```

添加绑定：

| Binding name | D1 database |
| --- | --- |
| `DB` | `nav-item-db` |

### 6. 设置环境变量

在 Pages 项目设置里：

```text
Settings → Environment variables
```

Production 和 Preview 都建议设置：

| 变量名 | 示例值 | 说明 |
| --- | --- | --- |
| `ADMIN_USERNAME` | `admin` | 初始管理员用户名 |
| `ADMIN_PASSWORD` | `123456` | 初始管理员密码 |
| `JWT_SECRET` | `请改成强随机字符串` | JWT 签名密钥 |

> 如果已经登录后台修改过密码，`ADMIN_PASSWORD` 只用于首次初始化默认用户，不会覆盖已有用户密码。

### 7. 重新部署

保存绑定和环境变量后，在 Pages 项目里触发一次重新部署：

```text
Deployments → Retry deployment
```

部署完成后访问：

```text
https://你的项目名.pages.dev
https://你的项目名.pages.dev/admin
```

## 使用 Wrangler 直接部署 Pages

如果不想通过 GitHub 自动构建，也可以本地直接部署：

```bash
npm install
cd web && npm install && npm run build
cd ..
npx wrangler pages project create nav-item-cf --production-branch main --compatibility-date=2025-01-01 --compatibility-flag=nodejs_compat
npx wrangler pages deploy web/dist --project-name nav-item-cf
```

注意：直接部署后仍需要确认 Pages 项目里已经有：

- D1 binding：`DB`
- 环境变量：`ADMIN_USERNAME`、`ADMIN_PASSWORD`、`JWT_SECRET`

## 本地开发

初始化本地 D1：

```bash
npx wrangler d1 migrations apply nav-item-db --local
```

启动本地 Pages：

```bash
npm run pages:dev
```

默认地址：

```text
http://localhost:8788
```

## 常用命令

```bash
# 构建前端
npm run web:build

# 本地 Pages dev
npm run pages:dev

# 直接部署 Pages
npm run pages:deploy

# 应用远程 D1 迁移
npx wrangler d1 migrations apply nav-item-db --remote
```

## 和原版的区别

| 原版 | 当前版本 |
| --- | --- |
| Express API | Cloudflare Pages Functions |
| SQLite 本地文件 | Cloudflare D1 |
| 本地 uploads 目录 | 小图片上传转 data URL 存储 |
| Docker / Node 服务部署 | Cloudflare Pages 部署 |
| 需要服务器常驻进程 | 无服务器部署 |

## 注意事项

1. Cloudflare D1 免费额度有限，大量数据或高并发请关注 Cloudflare 用量。
2. 当前上传 logo 会转为 data URL 存储，建议只上传小图标。
3. 如果需要大文件图片上传，建议后续接入 Cloudflare R2。
4. 首次部署后请立即修改默认后台密码。
5. `JWT_SECRET` 请使用强随机字符串，不要使用默认值。

## License

MIT
