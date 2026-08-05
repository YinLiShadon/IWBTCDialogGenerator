// localStorage 读写封装

// 通用读取（带默认值）
function loadJSON(key, defaultValue) {
    try {
        const raw = localStorage.getItem(key);
        if (raw === null) return defaultValue;
        return JSON.parse(raw);
    } catch (e) {
        console.warn('localStorage 读取失败:', key, e);
        return defaultValue;
    }
}

function saveJSON(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.warn('localStorage 写入失败:', key, e);
    }
}

// 加载对话
function loadConversations() {
    const saved = loadJSON('conversations', []);
    if (Array.isArray(saved)) {
        conversations = saved;
    }
}

function saveConversations() {
    saveJSON('conversations', conversations);
}

// 加载自定义角色
function loadCustomRoles() {
    const saved = loadJSON('customRoles', []);
    if (Array.isArray(saved)) {
        customRoles = saved;
    }
}

function saveCustomRoles() {
    saveJSON('customRoles', customRoles);
}

// 加载预设角色自定义名
function loadPresetRoleCustomNames() {
    const saved = loadJSON('presetRoleCustomNames', {});
    if (typeof saved === 'object' && saved !== null) {
        presetRoleCustomNames = saved;
    }
}

function savePresetRoleCustomNames() {
    saveJSON('presetRoleCustomNames', presetRoleCustomNames);
}

// 加载自己配置
function loadSelfConfig() {
    const saved = loadJSON('selfConfig', { name: '我', avatar: '', title: { text: '', color: '#FF6B6B' } });
    if (typeof saved === 'object' && saved !== null) {
        selfConfig = Object.assign({ name: '我', avatar: '', title: { text: '', color: '#FF6B6B' } }, saved);
        if (!selfConfig.title) selfConfig.title = { text: '', color: '#FF6B6B' };
    }
}

function saveSelfConfig() {
    saveJSON('selfConfig', selfConfig);
}

// 加载头衔模板
function loadSenderTitles() {
    const saved = loadJSON('senderTitles', {});
    if (typeof saved === 'object' && saved !== null) {
        senderTitles = saved;
    }
}

function saveSenderTitles() {
    saveJSON('senderTitles', senderTitles);
}

// 加载头衔全局开关
function loadTitlesEnabled() {
    const saved = localStorage.getItem('titlesEnabled');
    if (saved === null) {
        titlesEnabled = true;
    } else {
        titlesEnabled = saved === 'true';
    }
}

function saveTitlesEnabled() {
    saveJSON('titlesEnabled', titlesEnabled);
}
