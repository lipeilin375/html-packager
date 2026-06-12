function $(id) {
    return document.getElementById(id);
}

/**
 * 获取 releases 索引
 */
async function fetchReleases() {
    const res = await fetch(CONFIG.releaseIndex + "?t=" + Date.now());

    if (!res.ok) {
        throw new Error("无法加载 releases/index.json");
    }

    return await res.json();
}

/**
 * 创建下载按钮
 */
function createDownloadButton(label, url) {
    const a = document.createElement("a");

    a.href = url;
    a.target = "_blank";
    a.className = "download-btn";
    a.innerText = label;

    return a;
}

/**
 * 渲染单个 release 卡片
 */
function renderRelease(item) {
    const card = document.createElement("div");
    card.className = "card";

    const title = document.createElement("h2");
    title.innerText = item.name;

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.innerHTML = `
        <p><b>版本：</b>${item.version}</p>
        <p><b>Job：</b>${item.id}</p>
    `;

    const btnGroup = document.createElement("div");
    btnGroup.className = "btn-group";

    if (item.windows) {
        btnGroup.appendChild(
            createDownloadButton("⬇ Windows", item.windows)
        );
    }

    if (item.linux) {
        btnGroup.appendChild(
            createDownloadButton("⬇ Linux", item.linux)
        );
    }

    if (item.macos) {
        btnGroup.appendChild(
            createDownloadButton("⬇ macOS", item.macos)
        );
    }

    const openBtn = document.createElement("a");
    openBtn.href = `https://github.com/${CONFIG.owner}/${CONFIG.repo}/releases/tag/${item.id}`;
    openBtn.target = "_blank";
    openBtn.className = "download-btn secondary";
    openBtn.innerText = "🔗 GitHub Release";

    btnGroup.appendChild(openBtn);

    card.appendChild(title);
    card.appendChild(meta);
    card.appendChild(btnGroup);

    return card;
}

/**
 * 渲染列表
 */
function renderList(list) {
    const container = $("releaseList");

    container.innerHTML = "";

    if (!list || list.length === 0) {
        container.innerHTML = `
            <div class="card">
                <p>暂无发布记录</p>
            </div>
        `;
        return;
    }

    // 最新在前
    list.reverse().forEach(item => {
        container.appendChild(renderRelease(item));
    });
}

/**
 * 主加载函数
 */
async function loadReleases() {
    const loading = $("loading");

    try {
        loading.innerText = "正在加载发布列表...";

        const data = await fetchReleases();

        renderList(data);

        loading.innerText = `加载完成，共 ${data.length} 个应用`;

    } catch (err) {
        console.error(err);

        loading.className = "status error";
        loading.innerText = "加载失败：" + err.message;
    }
}

/**
 * 刷新按钮
 */
$("refreshBtn").onclick = () => {
    loadReleases();
};

// 初始化
loadReleases();