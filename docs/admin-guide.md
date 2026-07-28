# 五味书房内容后台使用指南

五味书房使用 Sveltia CMS 作为 Git 内容后台。后台不会建立数据库，文章仍保存在仓库的 `src/content/` 目录中，图片保存在 `public/images/uploads/`。

## 1. 访问后台

本地开发：

```powershell
cd E:\ztest\wuwei-blog
npm run dev
```

打开：

```text
http://localhost:4321/admin/
```

本地页面会显示 `Work with Local Repository`：

1. 点击该按钮。
2. 在目录选择器中选择 `E:\ztest\wuwei-blog` 仓库根目录。
3. 浏览器获得本次授权后，后台可以直接读写本地 Markdown 和图片。
4. 保存后先在网站中预览并运行 `npm run verify`，再自行提交 Git。

本地仓库模式不需要 GitHub access token。建议使用 Chrome 或 Edge，并只授权博客仓库根目录，不要选择整个磁盘或用户目录。

部署后打开：

```text
https://你的域名/admin/
```

后台不会出现在网站一级导航中，并通过 robots、Sitemap 和响应头阻止搜索引擎收录。

## 2. 创建 GitHub 细粒度访问令牌

线上后台只允许 GitHub access token 登录，不在仓库或网页代码中保存令牌。本地仓库模式不需要创建令牌。

在 GitHub 打开 `Settings → Developer settings → Personal access tokens → Fine-grained tokens`，创建一个令牌：

- Resource owner：`lvyongjie-hub`
- Repository access：只选择 `wuwei-blog`
- Repository permissions：`Contents` 设置为 `Read and write`
- Expiration：建议设置 30～90 天，到期后重新创建

不要授予账户、组织、工作流或其他仓库权限。不要把令牌写进 Markdown、环境变量示例、Issue、聊天记录或截图。

进入后台后选择 access token 登录并粘贴令牌。只在可信任的个人设备上使用；设备丢失或怀疑泄露时，应立即在 GitHub 撤销令牌。

## 3. 创建内容

后台提供以下集合：

- 书房文章
- 实验记录
- 随笔
- 项目档案
- 知识库目录

创建内容时需要填写英文 URL 标识。它只用于生成稳定文件名和网址，例如：

```text
freertos-resource-ownership
```

不要在 URL 标识中使用日期、中文、空格或容易变化的版本号。

后台保存后的文件位置：

| 内容类型   | 仓库目录                   |
| ---------- | -------------------------- |
| 书房文章   | `src/content/study/`       |
| 实验记录   | `src/content/experiments/` |
| 随笔       | `src/content/notes/`       |
| 项目档案   | `src/content/projects/`    |
| 知识库目录 | `src/content/books/`       |

后台为每种内容类型使用一种规范扩展名：书房文章、实验、随笔和知识库目录使用 `.md`，项目档案使用 `.mdx`。如果在本地额外创建了其他扩展名的文件，它仍可被 Astro 构建，但不保证出现在后台列表中。

书房文章需要出现在首页“代表文章”时，开启“首页精选”。首页优先展示精选文章；没有精选文章时，自动展示最新文章。

## 4. 保存与发布

Sveltia CMS 当前尚不支持 Editorial Workflow。后台点击保存后会直接向 `main` 提交：

1. GitHub Actions 自动运行格式、类型、构建、链接和可访问性检查。
2. Cloudflare Pages 在检查和构建成功后更新正式站点。
3. 构建失败时，正式站点继续保留上一个成功版本；应修正内容后再次保存，或在 GitHub 中回退错误提交。

后台删除入口已经禁用。需要撤下内容时，优先使用以下方式：

- 设置 `draft: true`，从网站中隐藏。
- 对支持生命周期的文章设置“已归档”；知识库目录可以开启“隐藏知识库”。
- 需要真正删除文件时，在本地 Git 分支中完成并通过 PR 审核。

注意：仓库是公开的，`draft: true` 只能阻止网站渲染，不能保护已经提交到 GitHub 的私人草稿或敏感资料。

## 5. 图片

后台上传的图片进入：

```text
public/images/uploads/
```

正文中的公开地址为：

```text
/images/uploads/图片文件名.webp
```

上传前应：

- 删除客户名称、设备序列号、密钥、路径和敏感指标。
- 优先转换为 WebP 或 AVIF。
- 使用有意义的英文文件名。
- 为图片填写清楚的替代文本和说明。
- 大型原始照片、视频和数据集不要提交到博客仓库。

## 6. Markdown 与 MDX 边界

后台适合普通 Markdown 标题、列表、代码块、表格、引用和图片。项目档案虽然保存为 `.mdx`，但后台正文仍应只使用普通 Markdown 语法。

包含以下内容时，仍建议使用本地编辑器：

- Astro 组件 import。
- Mermaid 组件。
- 自定义 Callout 或 RepositoryCard。
- 复杂公式和需要精确控制的 MDX 结构。

后台编辑已有 MDX 前，应先在 Git 中确认差异，避免可视化编辑器重排手写组件。

## 7. 后续 OAuth 登录

如果以后不想手动创建 access token，可以部署 Sveltia 官方的 Cloudflare Worker OAuth 服务，并在后台配置中增加 `base_url`。OAuth Client Secret 只能存放在 Cloudflare Worker 的加密环境变量中，不能进入博客仓库。
