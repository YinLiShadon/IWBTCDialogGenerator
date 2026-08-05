// 字体加载
// - 从 Font/ 目录读取两个 woff 文件
// - 用 fetch + FileReader 转为 data URL（与角色头像加载方式一致）
// - LiberationSans 为主字体（拉丁字母/数字）
// - SourceHanSansSC 为回退字体（中文/日文/韩文）
const FONT_FILES = [
    { name: 'LiberationSans',  path: 'Font/LiberationSans-Regular.woff',  format: 'woff' },
    { name: 'SourceHanSansSC', path: 'Font/SourceHanSansSC-Regular.woff', format: 'woff' }
];

async function loadFontFileAsDataURL(fontDef) {
    try {
        const url = new URL(fontDef.path, window.location.href).href;
        const response = await fetch(url);
        if (!response.ok) {
            console.warn('字体 fetch 失败:', fontDef.path, response.status);
            return null;
        }
        const blob = await response.blob();
        return await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => {
                console.warn('字体 FileReader 失败:', fontDef.path);
                resolve(null);
            };
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.warn('字体加载异常:', fontDef.path, e);
        return null;
    }
}

async function loadFonts() {
    const results = [];
    const styleEl = document.createElement('style');
    let cssText = '';

    for (const fontDef of FONT_FILES) {
        const dataUrl = await loadFontFileAsDataURL(fontDef);
        if (dataUrl) {
            cssText += `@font-face { font-family: '${fontDef.name}'; src: url('${dataUrl}') format('${fontDef.format}'); font-weight: normal; font-style: normal; font-display: swap; }\n`;
            results.push({ name: fontDef.name, success: true });
        } else {
            results.push({ name: fontDef.name, success: false });
        }
    }

    if (cssText) {
        styleEl.textContent = cssText;
        document.head.appendChild(styleEl);
    }

    // 兜底等待 document.fonts.ready（最多 8 秒），不阻塞初始化
    if (document.fonts && document.fonts.ready) {
        const timeout = new Promise((resolve) => setTimeout(() => resolve('__timeout__'), 8000));
        try {
            await Promise.race([document.fonts.ready, timeout]);
        } catch (e) { /* ignore */ }
    }

    const failed = results.filter(r => !r.success);
    if (failed.length > 0) {
        console.warn('字体加载失败:', failed.map(f => f.name));
    } else {
        console.log('字体加载完成:', results);
    }
    return results;
}
