# html-packager

将你的网站或 Web 应用打包成跨平台桌面应用（Windows、macOS、Linux）。支持自动化构建和发布流程。

## 功能特性

- 🚀 **一键打包** - 上传 HTML/Web 应用，自动生成各平台可执行文件
- 🖥️ **跨平台支持** - Windows (.exe, .msi) / macOS (.dmg) / Linux (.deb, .AppImage, .tar.gz)
- 🤖 **自动化构建** - 使用 GitHub Actions 工作流进行无缝构建
- 🎨 **自定义图标** - 为应用生成平台特定的图标
- 📦 **完整元数据** - 支持应用名称、版本、标识符、作者信息

## 快速开始

### 前提条件

- GitHub 账户
- 个人访问令牌（PAT）用于上传文件和触发工作流

### 获取个人访问令牌

1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token" → "Generate new token (classic)"
3. 勾选以下权限：
   - `repo`（完整访问仓库）
   - `workflow`（访问工作流）
4. 点击 "Generate token" 并保存令牌

### 使用步骤

1. **Fork 本仓库**
   ```bash
   # 访问 https://github.com/lipeilin375/html-packager
   # 点击右上角 "Fork" 按钮
   ```

2. **打开打包工具**
   - 访问你 fork 的仓库
   - 进入 `docs` 文件夹或使用 GitHub Pages
   - 或直接访问：`https://<your-username>.github.io/html-packager`

3. **填写应用信息**
   ```
   应用名称        - 你的应用名称
   版本            - 版本号（如 1.0.0）
   标识符          - 唯一标识符（如 com.example.myapp）
   作者            - 开发者名称
   GitHub Token    - 你的个人访问令牌
   ```

4. **上传文件**
   - **ZIP 文件** - 包含 HTML/CSS/JS 的网站根目录压缩包
     - 必须包含 `index.html` 作为入口点
     - 最大大小：20MB
   - **图标** - 应用图标（PNG、JPG、ICO 等）
     - 建议尺寸：512×512 像素或更大

5. **选择目标平台**
   - Windows
   - macOS
   - Linux (x86_64)
   - Linux (ARM64)

6. **点击"打包应用"**
   - 工具将上传文件并触发 GitHub Actions 工作流
   - 构建通常需要 5-15 分钟

7. **下载构建成果**
   - 访问仓库的 "Releases" 页面
   - 下载对应平台的可执行文件

## 项目结构

```
.
├── docs/                      # Web UI 界面
│   ├── index.html            # 打包工具网页
│   ├── script.js             # 核心逻辑
│   └── style.css             # 样式表
├── .github/workflows/
│   └── build.yml             # GitHub Actions 工作流
├── upload/                   # 临时上传文件夹
└── README.md                 # 本文件
```

## 工作流程详解

### 构建流程

1. **准备阶段** (`prepare`)
   - 读取元数据 JSON
   - 上传 ZIP 和图标文件作为制品

2. **平台特定构建**
   - Windows: 在 `windows-latest` 上构建 (.exe, .msi)
   - macOS: 在 `macos-latest` 上构建 (.dmg)
   - Linux x86_64: 在 `ubuntu-latest` 上构建 (.deb, .AppImage)
   - Linux ARM64: 在 `ubuntu-24.04-arm` 上构建（包含离线包）

3. **发布阶段** (`release`)
   - 收集所有平台的制品
   - 创建 GitHub Release

4. **清理阶段** (`cleaner`)
   - 删除上传的临时文件

### 使用的技术

- **Tauri** - 跨平台桌面应用框架
- **Node.js** - 构建工具链
- **Rust** - Tauri 底层支持
- **GitHub Actions** - 自动化 CI/CD

## 本地开发

### 环境要求

- Node.js 20+
- Rust (通过 rustup)
- Git

### 本地测试（可选）

```bash
# 克隆你 fork 的仓库
git clone https://github.com/<your-username>/html-packager.git
cd html-packager

# 本地开发 Web UI（可选）
# 直接在浏览器中打开 docs/index.html
```

## 常见问题

### Q: 如何处理超过 20MB 的项目？

A: 你可以：
- 压缩资源文件（图片、视频等）
- 使用外部 CDN 加载大型资源
- 分割项目为多个 Web 应用

### Q: 应用图标应该是什么格式？

A: 支持常见格式：
- PNG（推荐）
- JPG
- ICO
- SVG

最佳尺寸为 512×512 像素或更大。

### Q: 如何更新已发布的应用版本？

A: 简单地使用新的版本号重新运行打包流程。新版本将作为单独的 Release 发布。

### Q: Token 是否安全？

A: Token 仅在你的浏览器中使用，**不会**被发送到任何第三方服务器。所有上传都直接到你的 GitHub 仓库。

### Q: 构建失败怎么办？

A: 查看 GitHub Actions 日志：
1. 进入你的仓库
2. 点击 "Actions" 标签
3. 找到失败的工作流
4. 查看具体错误信息

常见原因：
- ZIP 文件格式错误或不包含 `index.html`
- 图标文件损坏或格式不支持
- 依赖项安装失败（检查网络连接）

### Q: 我可以定制应用窗口吗？

A: 目前使用默认 Tauri 配置。如需高度定制，可以：
1. Fork 本项目
2. 修改 `.github/workflows/build.yml` 中的 `tauri.conf.json` 配置
3. 添加自定义 Rust 代码支持

### Q: 如何删除发布的 Release？

A: 在 GitHub 仓库的 Release 页面，点击 Release 旁的 "..." 菜单，选择"Delete"。

## 贡献指南

欢迎贡献！你可以：

1. Fork 仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

## 许可证

MIT License - 详见 LICENSE 文件

## 支持

如有问题或建议，请：
- 提交 [Issue](https://github.com/lipeilin375/html-packager/issues)
- 发起 [Discussion](https://github.com/lipeilin375/html-packager/discussions)

## 致谢

- [Tauri](https://tauri.app/) - 跨平台桌面应用框架
- [GitHub Actions](https://github.com/features/actions) - CI/CD 服务

---

**开始打包你的应用吧！** 🎉
