// 头衔(Title)功能：模板存储 + 全局开关 + 渲染辅助
//
// 数据模型：
// senderTitles = {
//   'self':                  { text, color },
//   'preset_<originalName>': { text, color },
//   'custom_<roleId>':       { text, color }
// }
// titlesEnabled (bool)：全局开关

// 获取头衔 key
function getTitleKey(sender) {
    if (!sender) return null;
    if (sender.type === 'self') return 'self';
    if (sender.type === 'preset') return 'preset_' + (sender.originalName || sender.name);
    if (sender.type === 'custom') return 'custom_' + (sender.id || sender.originalId || '');
    return null;
}

// 读取某 sender 的头衔（已规范化为 {text, color} 或 null）
function getTitleForSender(sender) {
    const key = getTitleKey(sender);
    if (!key) return null;
    const t = senderTitles[key];
    if (!t || !t.text) return null;
    return {
        text: t.text,
        color: t.color || '#FF6B6B'
    };
}

// 保存某 sender 的头衔
function setTitleForSender(sender, title) {
    const key = getTitleKey(sender);
    if (!key) return;
    if (!title || !title.text) {
        delete senderTitles[key];
    } else {
        senderTitles[key] = { text: title.text, color: title.color || '#FF6B6B' };
    }
    saveSenderTitles();
}

// 删除某 sender 的头衔
function removeTitleForSender(sender) {
    const key = getTitleKey(sender);
    if (!key) return;
    delete senderTitles[key];
    saveSenderTitles();
}

// 切换全局开关
function toggleTitlesEnabled() {
    titlesEnabled = !titlesEnabled;
    saveTitlesEnabled();
    updateTitleToggleButton();
    // 重渲染所有可见视图
    if (typeof renderMessages === 'function') renderMessages();
    if (typeof renderRoleManager === 'function') renderRoleManager();
    if (typeof renderSenderDropdown === 'function') renderSenderDropdown();
}

// 顶栏"头衔"按钮的视觉状态
function updateTitleToggleButton() {
    const btn = document.getElementById('btnTitles');
    if (!btn) return;
    btn.classList.toggle('titles-on', titlesEnabled);
    btn.classList.toggle('titles-off', !titlesEnabled);
    btn.title = titlesEnabled ? '点击隐藏所有头衔' : '点击显示所有头衔';
}

// 临时编辑头衔（用于编辑模态框），全局 editingTitle 变量
function setEditingTitle(text, color) {
    editingTitle = {
        text: text || '',
        color: color || '#FF6B6B'
    };
}

// 用于将所有消息中的 sender 标题（旧的、嵌入消息的方式）迁移到 senderTitles 表（一次性的兼容处理）
// 新消息发送时不再嵌入 title 字段到 sender，而是通过 senderTitles 表查询
function syncAllMessageTitles() {
    // 当前实现：不再在 sender 中嵌入 title 字段。
    // 此函数保留以便未来兼容。
}
