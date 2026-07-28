# 五味书房

“五味书房”是一个中文为主的开源个人数字书房，围绕嵌入式系统与固件工程，记录项目档案、工程文章、端侧 AI 实验和少量随笔。

> 我喜欢把复杂的系统拆开，慢慢做成可靠的东西；也把一路上的试错、学习和灵感，留在这间数字书房里。

## 本地开发

需要 Node.js 22 或更高版本：

```bash
npm install
npm run dev
```

常用检查：

```bash
npm run check          # Astro / TypeScript / frontmatter
npm run format:check   # Prettier
npm run build          # 静态构建 + Pagefind 索引
npm run links:check    # 构建产物链接
npm run a11y:check     # 构建产物 HTML 基础可访问性
npm run verify         # 运行完整发布前检查
```

`npm run build` 后可使用 `npm run preview` 预览 Pagefind 搜索和静态输出。

## 内容后台

运行 `npm run dev` 后访问 `http://localhost:4321/admin/`。本地可以直接选择博客仓库目录，线上则使用 GitHub 细粒度 access token 登录。后台可以管理书房文章、实验记录、随笔、项目档案和知识库目录，内容仍保存为仓库内 Markdown/MDX，不使用数据库。

首次登录、令牌权限、图片上传和发布边界见 [内容后台使用指南](./docs/admin-guide.md)。仓库公开，后台中的 `draft: true` 不能替代私人草稿库。

## 内容工作流

- 知识库文章放在 `src/content/study/`，项目放在 `src/content/projects/`。
- 实验记录放在 `src/content/experiments/`，随笔放在 `src/content/notes/`。
- `templates/` 提供各类 Markdown/MDX 起始模板。
- 内容公开前先确认脱敏边界；`draft: true` 不是公开仓库中的隐私保护措施。
- 项目页面只陈述实际完成的编译、静态检查和硬件验证，不把编译成功写成板级验证成功。

技术文章支持 Markdown/MDX、GFM、脚注、数学公式（KaTeX）、Mermaid（`src/components/Mermaid.astro`）、提示块和仓库引用卡片。代码块在浏览器支持剪贴板时提供复制按钮。

## 部署

源码托管在 [GitHub](https://github.com/lvyongjie-hub/wuwei-blog)，`main` 分支用于 Cloudflare Pages 正式构建。Cloudflare Pages 构建命令为 `npm run build`，输出目录为 `dist`。环境变量参考 `.env.example`。

## 许可证

- 网站代码、组件和主题：MIT，见 [LICENSE](./LICENSE)。
- 原创文章、项目档案和原创图片：CC BY-NC-SA 4.0，见 [CONTENT_LICENSE.md](./CONTENT_LICENSE.md)。
- 第三方依赖和字体按各自许可证使用。

贡献代码、组件和技术文档前请阅读 [CONTRIBUTING.md](./CONTRIBUTING.md) 与 [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)。原创内容区由“五味”主导，不接受未经邀请的普通文章投稿。
