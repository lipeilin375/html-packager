// 从 GitHub Pages URL 自动解析 owner 和 repo
function getRepoInfo() {
  const path = window.location.pathname;
  // Pages URL 格式: /{owner}/{repo}/ 或 /{owner}/{repo}/index.html
  const parts = path.split('/').filter(p => p);
  if (parts.length >= 2) {
    return { owner: parts[0], repo: parts[1] };
  }
  // 如果无法解析（比如本地开发），则手动指定
  return { owner: 'lipeilin375', repo: 'html-packager' };
}

const { owner, repo } = getRepoInfo();
const apiBase = `https://api.github.com/repos/${owner}/${repo}`;

// DOM 元素
const tokenInput = document.getElementById('token');
const zipInput = document.getElementById('htmlZip');
const iconInput = document.getElementById('iconFile');
const platformsSelect = document.getElementById('platforms');
const buildBtn = document.getElementById('buildBtn');
const statusDiv = document.getElementById('status');
const downloadDiv = document.getElementById('downloadLinks');
const zipFileName = document.getElementById('zipFileName');
const iconFileName = document.getElementById('iconFileName');

// 文件选择后显示文件名
zipInput.addEventListener('change', () => {
  zipFileName.textContent = zipInput.files[0]?.name || '未选择文件';
});
iconInput.addEventListener('change', () => {
  iconFileName.textContent = iconInput.files[0]?.name || '未选择文件';
});

buildBtn.addEventListener('click', async () => {
  const token = tokenInput.value.trim();
  const zipFile = zipInput.files[0];
  const iconFile = iconInput.files[0];
  const selectedPlatforms = [...platformsSelect.selectedOptions].map(o => o.value);
  const platforms = selectedPlatforms.join(',');

  // 表单验证
  if (!token) return alert('请输入 GitHub Token');
  if (!zipFile) return alert('请上传 HTML 压缩包');
  if (!iconFile) return alert('请上传应用图标');
  if (selectedPlatforms.length === 0) return alert('请至少选择一个目标平台');
  if (zipFile.size > 20 * 1024 * 1024) return alert('压缩包不能超过 20MB');

  statusDiv.textContent = '⏳ 初始化中...';
  downloadDiv.innerHTML = '';

  const headers = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
  };

  try {
    // 辅助函数：上传文件到 GitHub
    const uploadFile = async (file) => {
      statusDiv.textContent = `📤 上传 ${file.name} ...`;
      const arrayBuf = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuf);
      // 转换为 base64
      let binary = '';
      bytes.forEach(byte => binary += String.fromCharCode(byte));
      const base64 = btoa(binary);

      const path = `uploads/${file.name}`;
      const res = await fetch(`${apiBase}/contents/${path}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          message: `Upload ${file.name}`,
          content: base64,
          branch: 'main',
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(`上传 ${file.name} 失败: ${errData.message}`);
      }
      return (await res.json()).content.sha;
    };

    // 上传压缩包和图标
    await uploadFile(zipFile);
    await uploadFile(iconFile);

    // 触发 workflow_dispatch
    statusDiv.textContent = '⚡ 触发打包工作流...';
    const workflowRes = await fetch(`${apiBase}/actions/workflows/build.yml/dispatches`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ref: 'main',
        inputs: {
          archive_name: zipFile.name,
          icon_name: iconFile.name,
          platforms: platforms,
        },
      }),
    });

    if (!workflowRes.ok && workflowRes.status !== 204) {
      const err = await workflowRes.json();
      throw new Error(`触发工作流失败: ${err.message}`);
    }

    statusDiv.textContent = '✅ 工作流已触发，正在打包（预计 5-10 分钟）...';

    // 轮询最新 Release 的资产
    let releaseAssets = null;
    for (let i = 0; i < 90; i++) {  // 最多等待 15 分钟
      await new Promise(r => setTimeout(r, 10000));
      statusDiv.textContent = `⏱️ 等待打包完成... (${i + 1}/90)`;

      const releasesRes = await fetch(`${apiBase}/releases?per_page=5`, { headers });
      if (!releasesRes.ok) continue;
      const releases = await releasesRes.json();
      // 查找最新 Release 且含有资产
      const latestRelease = releases.find(r => r.assets.length > 0);
      if (latestRelease) {
        // 进一步检查是否与我们本次 run 关联（通过 tag_name 包含 run_id）
        // 这里简单判断，实际可用 run_id 更精准，但前端无法获取 run_id，所以用最新带资产 Release
        releaseAssets = latestRelease.assets;
        break;
      }
    }

    if (!releaseAssets || releaseAssets.length === 0) {
      statusDiv.textContent = '⏰ 打包超时或未找到产物，请前往 GitHub Actions 查看详情。';
      return;
    }

    // 显示下载链接
    statusDiv.textContent = '🎉 打包完成！点击下方链接下载：';
    downloadDiv.innerHTML = '<h3>📥 下载文件</h3>';
    releaseAssets.forEach(asset => {
      const link = document.createElement('a');
      link.href = asset.browser_download_url;
      link.textContent = asset.name;
      link.target = '_blank';
      downloadDiv.appendChild(link);
    });

  } catch (err) {
    statusDiv.textContent = `❌ 错误: ${err.message}`;
    console.error(err);
  }
});