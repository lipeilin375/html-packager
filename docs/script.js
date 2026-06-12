const REPO_OWNER = 'lipeilin375';      // 需替换为实际仓库所有者
const REPO_NAME = 'html-packager';            // 需替换为实际仓库名
const WORKFLOW_FILE = 'build.yml';

document.getElementById('buildForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const token = document.getElementById('githubToken').value;
    if (!token) {
        showMessage('请提供 GitHub Token', 'error');
        return;
    }

    const appName = document.getElementById('appName').value.trim();
    const version = document.getElementById('version').value.trim();
    const bundleId = document.getElementById('bundleId').value.trim();
    const platforms = Array.from(document.querySelectorAll('.checkbox-group input:checked')).map(cb => cb.value);
    const iconFile = document.getElementById('icon').files[0];
    const zipFile = document.getElementById('websiteZip').files[0];

    if (!appName || !version || !bundleId || platforms.length === 0 || !iconFile || !zipFile) {
        showMessage('请完整填写所有必填项', 'error');
        return;
    }
    if (zipFile.size > 20 * 1024 * 1024) {
        showMessage('压缩包不能超过 20MB', 'error');
        return;
    }

    const timestamp = Date.now();
    const safeName = appName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const zipPath = `upload/${safeName}-${timestamp}.zip`;
    const iconPath = `upload/${safeName}-icon-${timestamp}.png`;
    const metaPath = `upload/build-${timestamp}.json`;

    // 准备元数据
    const metadata = {
        app_name: appName,
        version: version,
        bundle_id: bundleId,
        platforms: platforms,
        zip_file: zipPath,
        icon_file: iconPath,
        timestamp: timestamp
    };

    const headers = {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json'
    };

    try {
        // 1. 上传 zip 文件
        await uploadFile(zipPath, zipFile, headers);
        // 2. 上传图标 (转换为 PNG)
        const iconBase64 = await fileToBase64(iconFile);
        await uploadFile(iconPath, iconBase64, headers, true);
        // 3. 上传 metadata.json
        const metaContent = btoa(unescape(encodeURIComponent(JSON.stringify(metadata, null, 2))));
        await uploadFile(metaPath, metaContent, headers, true);

        // 4. 触发 workflow_dispatch
        const dispatchUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_FILE}/dispatches`;
        const response = await fetch(dispatchUrl, {
            method: 'POST',
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ref: 'main',       // 触发分支，根据实际情况调整
                inputs: {
                    metadata_file: metaPath
                }
            })
        });
        if (!response.ok) throw new Error(`触发 Action 失败: ${response.status}`);
        showMessage('打包任务已提交！请稍后查看 Releases 页面获取下载链接。', 'success');
        document.getElementById('result').innerHTML = `<a href="https://github.com/${REPO_OWNER}/${REPO_NAME}/releases" target="_blank">前往 Releases 下载</a>`;
    } catch (err) {
        console.error(err);
        showMessage(`错误: ${err.message}`, 'error');
    }
});

async function uploadFile(path, contentOrFile, headers, isBase64Data = false) {
    let content;
    if (isBase64Data) {
        content = contentOrFile;
    } else if (contentOrFile instanceof File) {
        content = await fileToBase64(contentOrFile);
    } else {
        content = contentOrFile;
    }

    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
    // 检查文件是否存在（先获取 sha）
    let sha = null;
    try {
        const getRes = await fetch(url, { headers });
        if (getRes.ok) {
            const data = await getRes.json();
            sha = data.sha;
        }
    } catch (e) { /* 文件不存在则继续 */ }

    const body = {
        message: `Upload ${path}`,
        content: content,
        branch: 'main'
    };
    if (sha) body.sha = sha;

    const res = await fetch(url, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`上传 ${path} 失败: ${res.status} ${err}`);
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function showMessage(msg, type) {
    const msgDiv = document.getElementById('message');
    msgDiv.textContent = msg;
    msgDiv.className = `message ${type}`;
    setTimeout(() => {
        msgDiv.className = 'message';
    }, 8000);
}