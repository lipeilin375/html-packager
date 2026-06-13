const REPO_OWNER = 'lipeilin375';
const REPO_NAME  = 'html-packager';
const WORKFLOW_FILE = 'build.yml';

const API = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;

// ── helpers ──────────────────────────────────────────────────────────────────

function setStatus(msg, type = 'info') {
  const el = document.getElementById('status');
  el.textContent = msg;
  el.className = `status ${type}`;
  el.classList.remove('hidden');
}

async function toBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

async function putFile(path, content, token, sha = null) {
  const body = { message: `upload: ${path}`, content };
  if (sha) body.sha = sha;
  const res = await fetch(`${API}/contents/${path}`, {
    method: 'PUT',
    headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`上传 ${path} 失败: ${res.status} ${await res.text()}`);
  return res.json();
}

async function getFileSha(path, token) {
  const res = await fetch(`${API}/contents/${path}`, {
    headers: { Authorization: `token ${token}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`获取文件信息失败: ${res.status}`);
  return (await res.json()).sha;
}

// ── upload ────────────────────────────────────────────────────────────────────

async function uploadFile(file, repoPath, token) {
  const content = await toBase64(file);
  const sha = await getFileSha(repoPath, token);
  return putFile(repoPath, content, token, sha);
}

async function uploadJson(obj, repoPath, token) {
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(obj, null, 2))));
  const sha = await getFileSha(repoPath, token);
  return putFile(repoPath, content, token, sha);
}

// ── trigger workflow ──────────────────────────────────────────────────────────

async function triggerWorkflow(inputs, token) {
  const res = await fetch(`${API}/actions/workflows/${WORKFLOW_FILE}/dispatches`, {
    method: 'POST',
    headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ref: 'main', inputs }),
  });
  if (!res.ok) throw new Error(`触发 Workflow 失败: ${res.status} ${await res.text()}`);
}

// ── load releases ─────────────────────────────────────────────────────────────

async function loadReleases(token) {
  const headers = { Authorization: `token ${token}` };
  const res = await fetch(`${API}/releases?per_page=5`, { headers });
  if (!res.ok) return;
  const releases = await res.json();
  if (!releases.length) return;

  const container = document.getElementById('releaseList');
  container.innerHTML = '';
  releases.forEach(r => {
    const exts = ['.exe', '.msi', '.deb', '.AppImage', '.dmg'];
    const assets = r.assets.filter(a => exts.some(e => a.name.endsWith(e)));
    if (!assets.length) return;

    const item = document.createElement('div');
    item.className = 'release-item';
    item.innerHTML = `<h3>${r.name}</h3><div class="release-assets">${
      assets.map(a => `<a class="asset-link" href="${a.browser_download_url}" target="_blank">⬇ ${a.name}</a>`).join('')
    }</div>`;
    container.appendChild(item);
  });

  if (container.children.length) {
    document.getElementById('releases').classList.remove('hidden');
  }
}

// ── form submit ───────────────────────────────────────────────────────────────

document.getElementById('packForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const appName    = document.getElementById('appName').value.trim();
  const version    = document.getElementById('version').value.trim();
  const identifier = document.getElementById('identifier').value.trim();
  const author     = document.getElementById('author').value.trim();
  const token      = document.getElementById('token').value.trim();
  const zipFile    = document.getElementById('zipFile').files[0];
  const iconFile   = document.getElementById('iconFile').files[0];
  const platforms  = [...document.querySelectorAll('input[name="platform"]:checked')].map(c => c.value);

  if (!platforms.length) { setStatus('请至少选择一个目标平台', 'error'); return; }
  if (zipFile.size > 20 * 1024 * 1024) { setStatus('ZIP 文件超过 20MB 限制', 'error'); return; }

  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  setStatus('正在上传文件...', 'info');

  try {
    const ts = Date.now();
    const zipPath  = `upload/site-${ts}.zip`;
    const iconExt  = iconFile.name.split('.').pop();
    const iconPath = `upload/icon-${ts}.${iconExt}`;
    const metaPath = `upload/meta-${ts}.json`;

    await Promise.all([
      uploadFile(zipFile, zipPath, token),
      uploadFile(iconFile, iconPath, token),
    ]);

    setStatus('正在上传元数据并触发构建...', 'info');

    await uploadJson({ appName, version, identifier, author, platforms }, metaPath, token);
    await triggerWorkflow({ meta_path: metaPath, zip_path: zipPath, icon_path: iconPath }, token);

    setStatus('✅ 构建已启动！请前往 GitHub Actions 查看进度，完成后可在下方下载。', 'success');
    setTimeout(() => loadReleases(token), 3000);
  } catch (err) {
    setStatus(`❌ ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
  }
});

// ── init: load existing releases if token present ─────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const tokenEl = document.getElementById('token');
  tokenEl.addEventListener('change', () => {
    if (tokenEl.value.trim()) loadReleases(tokenEl.value.trim());
  });
});
