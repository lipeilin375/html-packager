document.getElementById('buildBtn').addEventListener('click', async () => {
  const token = document.getElementById('token').value;
  const zipFile = document.getElementById('htmlZip').files[0];
  const iconFile = document.getElementById('iconFile').files[0];
  const platforms = [...document.getElementById('platforms').selectedOptions].map(o => o.value).join(',');

  if (!token || !zipFile || !iconFile || !platforms) {
    return alert('请填写所有必填项');
  }
  if (zipFile.size > 20 * 1024 * 1024) {
    return alert('压缩包不能超过20MB');
  }

  const statusDiv = document.getElementById('status');
  const linksDiv = document.getElementById('downloadLinks');
  statusDiv.textContent = '正在上传文件...';
  const owner = 'lipeilin375';
  const repo = 'html-packager';
  const apiBase = `https://api.github.com/repos/${owner}/${repo}`;

  const headers = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json'
  };

  try {
    // 1. 上传压缩包和图标至 uploads/ 目录
    const uploadFile = async (file) => {
      const content = await file.arrayBuffer();
      const base64Content = btoa(String.fromCharCode(...new Uint8Array(content)));
      const path = `uploads/${file.name}`;
      const res = await fetch(`${apiBase}/contents/${path}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          message: `Upload ${file.name}`,
          content: base64Content,
          branch: 'main'
        })
      });
      if (!res.ok) throw new Error(`上传失败: ${res.status}`);
      return (await res.json()).content.sha;
    };

    statusDiv.textContent = '上传压缩包...';
    const zipSha = await uploadFile(zipFile);
    statusDiv.textContent = '上传图标...';
    const iconSha = await uploadFile(iconFile);

    // 2. 触发 workflow dispatch
    statusDiv.textContent = '触发打包工作流...';
    const workflowRes = await fetch(`${apiBase}/actions/workflows/build.yml/dispatches`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ref: 'main',
        inputs: {
          archive_name: zipFile.name,
          icon_name: iconFile.name,
          platforms
        }
      })
    });
    if (!workflowRes.ok) throw new Error('触发工作流失败');

    statusDiv.textContent = '工作流已触发，正在打包（约5-10分钟）...';

    // 3. 轮询最新 Release 直到 assets 出现
    let releaseAssets = null;
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 10000));
      const releasesRes = await fetch(`${apiBase}/releases?per_page=5`, { headers });
      const releases = await releasesRes.json();
      const latest = releases[0];
      if (latest && latest.assets.length > 0) {
        releaseAssets = latest.assets;
        break;
      }
      statusDiv.textContent = `等待打包完成... (${i+1}/60)`;
    }

    if (!releaseAssets) {
      statusDiv.textContent = '打包超时，请检查 GitHub Actions 运行状态。';
      return;
    }

    // 4. 显示下载链接
    statusDiv.textContent = '打包完成！';
    linksDiv.innerHTML = '<h3>下载：</h3>' + releaseAssets.map(a => 
      `<a href="${a.browser_download_url}" target="_blank">${a.name}</a><br>`
    ).join('');
  } catch (err) {
    statusDiv.textContent = '错误：' + err.message;
  }
});