function $(id) {
  return document.getElementById(id);
}

/**
 * 文件转 Base64
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const base64 = reader.result.split(",")[1];
      resolve(base64);
    };

    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

/**
 * 生成唯一 Job ID
 */
function createJobId() {
  return "job-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
}

/**
 * GitHub API 上传文件
 */
async function uploadFile(token, path, content, message) {
  const url = `${CONFIG.apiBase}/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${path}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github+json"
    },
    body: JSON.stringify({
      message: message || "upload",
      content
    })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Upload failed");
  }

  return data;
}

/**
 * 触发 GitHub Actions
 */
async function triggerWorkflow(token, jobId) {
  const url = `${CONFIG.apiBase}/repos/${CONFIG.owner}/${CONFIG.repo}/actions/workflows/${CONFIG.workflow}/dispatches`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github+json"
    },
    body: JSON.stringify({
      ref: CONFIG.branch,
      inputs: {
        job: jobId
      }
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
}

/**
 * 获取选中的平台
 */
function getPlatforms() {
  return [...document.querySelectorAll(".platforms input:checked")]
    .map(el => el.value);
}

/**
 * 主构建流程
 */
$("buildBtn").onclick = async () => {
  const status = $("status");

  const token = $("token").value.trim();
  const appName = $("appName").value.trim();
  const version = $("version").value.trim();
  const identifier = $("identifier").value.trim();

  const zip = $("zip").files[0];
  const icon = $("icon").files[0];

  const platforms = getPlatforms();

  // 基础校验
  if (!token) return alert("请输入 GitHub Token");
  if (!zip) return alert("请选择 ZIP 文件");

  if (zip.size > CONFIG.maxFileSize) {
    return alert("ZIP 文件超过 20MB 限制");
  }

  status.className = "status";
  status.innerText = "正在准备任务...";

  try {
    const jobId = createJobId();

    status.innerText = "正在上传 HTML 包...";

    const zipBase64 = await fileToBase64(zip);

    await uploadFile(
      token,
      `${CONFIG.paths.html}/${jobId}.zip`,
      zipBase64,
      "upload html zip"
    );

    status.innerText = "正在上传图标...";

    let iconPath = "";
    if (icon) {
      const iconBase64 = await fileToBase64(icon);

      iconPath = `${CONFIG.paths.icons}/${jobId}.png`;

      await uploadFile(
        token,
        iconPath,
        iconBase64,
        "upload icon"
      );
    }

    status.innerText = "生成任务文件...";

    const job = {
      id: jobId,
      name: appName,
      version,
      identifier,
      platforms,
      htmlZip: `${CONFIG.paths.html}/${jobId}.zip`,
      icon: iconPath,
      status: "pending",
      createdAt: new Date().toISOString()
    };

    const jobBase64 = btoa(
      unescape(
        encodeURIComponent(JSON.stringify(job, null, 2))
      )
    );

    await uploadFile(
      token,
      `${CONFIG.paths.jobs}/${jobId}.json`,
      jobBase64,
      "create job"
    );

    status.innerText = "触发 GitHub Actions 构建...";

    await triggerWorkflow(token, jobId);

    status.className = "status success";
    status.innerHTML = `
            ✅ 任务已提交<br/>
            Job ID: <b>${jobId}</b><br/>
            请前往「任务状态」页面查看进度
        `;

  } catch (err) {
    console.error(err);

    status.className = "status error";
    status.innerText = "❌ 错误：" + err.message;
  }
};