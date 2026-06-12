function $(id) {
  return document.getElementById(id);
}

/**
 * 读取 JSON 文件（GitHub raw）
 */
async function fetchJSON(path) {
  const url = `${CONFIG.apiBase}/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${path}`;

  const res = await fetch(url, {
    headers: {
      "Accept": "application/vnd.github+json"
    }
  });

  if (!res.ok) {
    throw new Error("无法读取：" + path);
  }

  const data = await res.json();

  const content = atob(data.content);

  return JSON.parse(decodeURIComponent(escape(content)));
}

/**
 * 获取 release index
 */
async function fetchReleases() {
  const res = await fetch(CONFIG.releaseIndex);

  if (!res.ok) return [];

  return await res.json();
}

/**
 * 渲染状态颜色
 */
function setStatusBox(text, type = "idle") {
  const box = $("statusBox");

  box.className = "status " + type;
  box.innerText = text;
}

/**
 * 渲染 job 信息
 */
function renderJob(job) {
  $("resultCard").style.display = "block";

  $("jobInfo").innerHTML = `
        <p><b>名称：</b>${job.name}</p>
        <p><b>版本：</b>${job.version}</p>
        <p><b>包名：</b>${job.identifier}</p>
        <p><b>状态：</b>${job.status}</p>
        <p><b>创建时间：</b>${job.createdAt || "-"}</p>
    `;

  // 模拟进度（真实项目可由 workflow 写回）
  let progress = 0;

  if (job.status === "pending") progress = 10;
  if (job.status === "building") progress = 50;
  if (job.status === "success") progress = 100;
  if (job.status === "failed") progress = 100;

  $("progressBar").style.width = progress + "%";

  $("progressBar").style.background =
    job.status === "failed"
      ? "#ff5c7a"
      : "#7c5cff";

  // 平台显示
  $("platformResult").innerHTML = `
        <h3>构建平台</h3>
        <p>${job.platforms.join(", ")}</p>
    `;
}

/**
 * 渲染 release 下载链接
 */
function renderReleases(jobId, releases) {
  const target = releases.find(r => r.id === jobId);

  if (!target) {
    $("releaseLinks").innerHTML = "<p>暂无 Release</p>";
    return;
  }

  $("releaseLinks").innerHTML = `
        <h3>下载链接</h3>

        ${target.windows ? `<a href="${target.windows}" target="_blank">Windows</a><br/>` : ""}
        ${target.linux ? `<a href="${target.linux}" target="_blank">Linux</a><br/>` : ""}
        ${target.macos ? `<a href="${target.macos}" target="_blank">macOS</a><br/>` : ""}
    `;
}

/**
 * 主查询逻辑
 */
async function queryJob(jobId) {
  const statusBox = $("statusBox");

  try {
    setStatusBox("正在查询任务...", "idle");

    const job = await fetchJSON(`${CONFIG.paths.jobs}/${jobId}.json`);

    if (!job) {
      setStatusBox("未找到任务", "error");
      return;
    }

    // 状态显示
    if (job.status === "pending") {
      setStatusBox("等待构建中...", "idle");
    }

    if (job.status === "building") {
      setStatusBox("构建中，请稍候...", "idle");
    }

    if (job.status === "success") {
      setStatusBox("构建完成 ✅", "success");
    }

    if (job.status === "failed") {
      setStatusBox("构建失败 ❌", "error");
    }

    renderJob(job);

    const releases = await fetchReleases();

    renderReleases(jobId, releases);

    // 自动轮询（构建中才开启）
    if (job.status === "pending" || job.status === "building") {
      setTimeout(() => queryJob(jobId), 5000);
    }

  } catch (err) {
    console.error(err);
    setStatusBox("查询失败：" + err.message, "error");
  }
}

/**
 * 按钮事件
 */
$("queryBtn").onclick = () => {
  const jobId = $("jobIdInput").value.trim();

  if (!jobId) {
    alert("请输入 Job ID");
    return;
  }

  queryJob(jobId);
};