// 工具函数

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
}

function clampInt(val, min, max) {
    let n = parseInt(val, 10);
    if (isNaN(n)) n = min;
    if (n < min) n = min;
    if (n > max) n = max;
    return n;
}

function toHex2(n) {
    return n.toString(16).padStart(2, '0').toUpperCase();
}

// 将任意路径或 URL 的图片转为 data URL（fetch + FileReader，与角色头像加载方式一致）
async function imageToDataURL(src, defaultAvatar) {
    if (!src) return defaultAvatar || '';
    if (src.startsWith('data:')) return src;
    if (!defaultAvatar) {
        defaultAvatar = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'48\' viewBox=\'0 0 48 48\'%3E%3Ccircle cx=\'24\' cy=\'24\' r=\'24\' fill=\'%23666\'/%3E%3C/svg%3E';
    }

    let imageSrc = src;
    if (!imageSrc.startsWith('http') && !imageSrc.startsWith('file') && !imageSrc.startsWith('data:')) {
        imageSrc = new URL(imageSrc, window.location.href).href;
    }

    try {
        const response = await fetch(imageSrc);
        if (!response.ok) {
            console.warn('Fetch failed for:', src, 'status:', response.status);
            return defaultAvatar;
        }
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => {
                console.warn('FileReader failed for:', src);
                resolve(defaultAvatar);
            };
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.warn('Image load failed for:', src, e);
        return defaultAvatar;
    }
}

// 通用：获取发送者的头衔信息（来自模板表）
function getSenderTitle(sender) {
    if (!sender) return null;
    let key;
    if (sender.type === 'self') {
        key = 'self';
    } else if (sender.type === 'preset') {
        const orig = sender.originalName || sender.name;
        key = 'preset_' + orig;
    } else if (sender.type === 'custom') {
        key = 'custom_' + (sender.id || sender.originalId || '');
    } else {
        return null;
    }
    const t = senderTitles[key];
    if (!t || !t.text) return null;
    return t;
}

// 渲染头衔 HTML 片段（如果开关开启且头衔存在）
// position: 'right'（默认，名称右侧）| 'left'（名称左侧，仅用于 self）
function renderTitleHtml(sender, position) {
    if (!titlesEnabled) return '';
    const t = getSenderTitle(sender);
    if (!t) return '';
    const color = t.color || '#888888';
    // 根据颜色亮度反色文字（黑/白）
    let r = 255, g = 255, b = 255;
    if (/^#[0-9A-F]{6}$/i.test(color)) {
        r = parseInt(color.slice(1, 3), 16);
        g = parseInt(color.slice(3, 5), 16);
        b = parseInt(color.slice(5, 7), 16);
    }
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const textColor = luminance > 0.6 ? '#000' : '#fff';
    const posClass = position === 'left' ? ' left' : '';
    return `<span class="sender-title${posClass}" style="background-color: ${color}; color: ${textColor};">${escapeHtml(t.text)}</span>`;
}
