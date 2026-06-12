window.CONFIG = {
    /**
     * GitHub 仓库配置
     * 用于上传文件 + 触发 Actions
     */
    owner: "lipeilin375",
    repo: "html-packager",
    branch: "main",

    /**
     * GitHub Actions workflow 文件名
     * 路径：.github/workflows/build.yml
     */
    workflow: "build.yml",

    /**
     * 上传限制（20MB）
     */
    maxFileSize: 20 * 1024 * 1024,

    /**
     * API 基础地址（可用于未来迁移 GitHub Enterprise）
     */
    apiBase: "https://api.github.com",

    /**
     * 文件路径前缀（统一管理上传结构）
     */
    paths: {
        html: "upload/html",
        icons: "upload/icons",
        jobs: "upload/jobs"
    },

    /**
     * 构建超时提示（UI层用）
     */
    buildTimeoutMinutes: 10,

    /**
     * release 索引文件
     */
    releaseIndex: "releases/index.json"
};