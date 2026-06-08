# Nav-Item Cloudflare Pages 版本

这是已经转换好的 Cloudflare Pages + Pages Functions + D1 版本。

## Cloudflare Pages 设置

- Framework preset: `None` 或 `Vue`
- Build command: `cd web && npm install && npm run build`
- Build output directory: `web/dist`
- Functions directory: `functions`

## 需要绑定的变量和 D1

在 Pages 项目里绑定 D1：

- Binding name: `DB`
- Database: `nav-item-db`

环境变量：

- `ADMIN_USERNAME`: `admin`
- `ADMIN_PASSWORD`: `123456`，部署后建议马上在后台修改
- `JWT_SECRET`: 任意强随机字符串

## D1 初始化

```bash
npx wrangler d1 create nav-item-db
npx wrangler d1 migrations apply nav-item-db --remote
```

## 本地构建

```bash
npm install
cd web && npm install && npm run build
```

## 功能

- 前端：Cloudflare Pages 静态托管
- API：Pages Functions `/api/*`
- 数据库：Cloudflare D1
- 后台：`/admin`
- 数据管理：支持 JSON 导出 / 导入
