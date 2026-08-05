// 颜色选择器弹窗：HSV / RGB / Hex 同步、SV 域 + 色相滑条拖动

// RGB <-> HSV 转换
function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    if (d !== 0) {
        if (max === r) h = ((g - b) / d) % 6;
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h *= 60;
        if (h < 0) h += 360;
    }
    const s = max === 0 ? 0 : (d / max) * 100;
    const v = max * 100;
    return { h: Math.round(h), s: Math.round(s), v: Math.round(v) };
}

function hsvToRgb(h, s, v) {
    s /= 100; v /= 100;
    const c = v * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = v - c;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; }
    else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; }
    else { r = c; b = x; }
    return {
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255)
    };
}

function hsvToHex(h, s, v) {
    const { r, g, b } = hsvToRgb(h, s, v);
    return '#' + toHex2(r) + toHex2(g) + toHex2(b);
}

// 将 hex 同步到所有 UI 控件
function syncPickerColor(hex) {
    const upper = (hex || '').toUpperCase();
    if (!/^#[0-9A-F]{6}$/.test(upper)) return;
    currentPickerColor = upper;
    const hexInput = document.getElementById('colorPickerHex');
    if (hexInput && hexInput.value.toUpperCase() !== upper) hexInput.value = upper;
    const r = parseInt(upper.slice(1, 3), 16);
    const g = parseInt(upper.slice(3, 5), 16);
    const b = parseInt(upper.slice(5, 7), 16);
    const rInput = document.getElementById('colorPickerR');
    const gInput = document.getElementById('colorPickerG');
    const bInput = document.getElementById('colorPickerB');
    if (rInput && Number(rInput.value) !== r) rInput.value = r;
    if (gInput && Number(gInput.value) !== g) gInput.value = g;
    if (bInput && Number(bInput.value) !== b) bInput.value = b;
    const preview = document.getElementById('colorPickerPreview');
    if (preview) preview.style.backgroundColor = upper;
    const hsv = rgbToHsv(r, g, b);
    currentHue = hsv.h; currentSat = hsv.s; currentVal = hsv.v;
    updateSvAreaVisuals();
    updateHueCursor();
}

function updateSvAreaVisuals() {
    const svArea = document.getElementById('colorPickerSVArea');
    const cursor = document.getElementById('colorPickerSVCursor');
    if (!svArea || !cursor) return;
    const hueColor = hsvToHex(currentHue, 100, 100);
    svArea.style.backgroundColor = hueColor;
    const sat = Math.max(0, Math.min(100, currentSat));
    const val = Math.max(0, Math.min(100, currentVal));
    const rect = svArea.getBoundingClientRect();
    const x = (sat / 100) * rect.width;
    const y = (1 - val / 100) * rect.height;
    cursor.style.left = x + 'px';
    cursor.style.top = y + 'px';
}

function updateHueCursor() {
    const track = document.getElementById('colorPickerHueTrack');
    const cursor = document.getElementById('colorPickerHueCursor');
    if (!track || !cursor) return;
    const rect = track.getBoundingClientRect();
    const x = (currentHue / 360) * rect.width;
    cursor.style.left = x + 'px';
}

// 绑定 SV 域 + hue 滑条鼠标事件（首次打开时执行）
function bindPickerEvents() {
    if (pickerEventsBound) return;
    pickerEventsBound = true;

    const svArea = document.getElementById('colorPickerSVArea');
    const hueTrack = document.getElementById('colorPickerHueTrack');

    const onSvPointer = (e) => {
        if (!svArea) return;
        const rect = svArea.getBoundingClientRect();
        const clientX = e.clientX;
        const clientY = e.clientY;
        let x = clientX - rect.left;
        let y = clientY - rect.top;
        if (x < 0) x = 0; if (x > rect.width) x = rect.width;
        if (y < 0) y = 0; if (y > rect.height) y = rect.height;
        currentSat = Math.round((x / rect.width) * 100);
        currentVal = Math.round((1 - y / rect.height) * 100);
        const hex = hsvToHex(currentHue, currentSat, currentVal);
        syncPickerColor(hex);
    };
    const onSvPointerDown = (e) => {
        if (!svArea) return;
        svDragging = true;
        e.preventDefault();
        onSvPointer(e);
    };

    const onHuePointer = (e) => {
        if (!hueTrack) return;
        const rect = hueTrack.getBoundingClientRect();
        let x = e.clientX - rect.left;
        if (x < 0) x = 0; if (x > rect.width) x = rect.width;
        currentHue = Math.round((x / rect.width) * 360);
        const hex = hsvToHex(currentHue, currentSat, currentVal);
        syncPickerColor(hex);
    };
    const onHuePointerDown = (e) => {
        if (!hueTrack) return;
        hueDragging = true;
        e.preventDefault();
        onHuePointer(e);
    };

    const onDocMove = (e) => {
        if (svDragging) onSvPointer(e);
        if (hueDragging) onHuePointer(e);
    };
    const onDocUp = () => {
        svDragging = false;
        hueDragging = false;
    };

    if (svArea) svArea.addEventListener('pointerdown', onSvPointerDown);
    if (hueTrack) hueTrack.addEventListener('pointerdown', onHuePointerDown);
    document.addEventListener('pointermove', onDocMove);
    document.addEventListener('pointerup', onDocUp);
    document.addEventListener('pointercancel', onDocUp);
}

// 模式：'message'（应用到选中文本） 或 'title'（修改头衔颜色）
let colorPickerMode = 'message';

function showColorPickerModal(mode) {
    colorPickerMode = mode || 'message';
    const modal = document.getElementById('colorPickerModal');
    if (!modal) return;
    bindPickerEvents();
    const basicPanel = document.getElementById('colorPickerBasic');
    if (basicPanel) {
        basicPanel.innerHTML = '';
        PRESET_COLORS.forEach(color => {
            const sw = document.createElement('div');
            sw.className = 'color-swatch';
            sw.style.backgroundColor = color;
            sw.title = color;
            sw.onclick = () => syncPickerColor(color);
            basicPanel.appendChild(sw);
        });
    }
    modal.classList.add('active');
    let initial;
    if (colorPickerMode === 'title') {
        initial = (editingTitle && editingTitle.color) || '#FF6B6B';
    } else {
        initial = currentPickerColor || '#FFFFFF';
    }
    requestAnimationFrame(() => {
        syncPickerColor(initial);
    });
}

function closeColorPickerModal() {
    const modal = document.getElementById('colorPickerModal');
    if (modal) modal.classList.remove('active');
}

function onColorHexInput(value) {
    const trimmed = (value || '').trim();
    const hex = trimmed.startsWith('#') ? trimmed : '#' + trimmed;
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
        syncPickerColor(hex);
    }
}

function onColorRgbInput() {
    const r = clampInt(document.getElementById('colorPickerR').value, 0, 255);
    const g = clampInt(document.getElementById('colorPickerG').value, 0, 255);
    const b = clampInt(document.getElementById('colorPickerB').value, 0, 255);
    const hex = '#' + toHex2(r) + toHex2(g) + toHex2(b);
    syncPickerColor(hex);
}

// 确认应用颜色
function confirmColorPicker() {
    if (colorPickerMode === 'title') {
        onEditingTitleColorChange(currentPickerColor);
    } else {
        applyTextColor(currentPickerColor);
    }
    closeColorPickerModal();
}
