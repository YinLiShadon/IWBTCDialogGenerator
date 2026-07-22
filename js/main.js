// 入口：DOMContentLoaded 初始化

// 加载进度辅助
function setLoadingProgress(bar, text, progress, label) {
    if (bar) bar.style.width = progress + '%';
    if (text && label) text.textContent = label;
}

document.addEventListener('DOMContentLoaded', async () => {
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    const loadingProgressBar = document.getElementById('loadingProgressBar');

    // 根据设备设置初始导出比例
    exportAspectRatio = isMobileDevice() ? '9:16' : '16:9';

    if (loadingOverlay) loadingOverlay.classList.add('show');

    // 1) 从 localStorage 加载所有持久化数据
    loadConversations();
    loadCustomRoles();
    loadPresetRoleCustomNames();
    loadSelfConfig();
    loadSenderTitles();
    loadTitlesEnabled();
    setLoadingProgress(loadingProgressBar, loadingText, 10, '正在加载对话...');

    // 2) 加载预设角色（fetch + fallback）
    setLoadingProgress(loadingProgressBar, loadingText, 30, '正在加载预设角色...');
    await loadPresetRoles();
    setLoadingProgress(loadingProgressBar, loadingText, 50, '正在加载字体...');

    // 3) 字体加载内置超时，18 秒兜底
    const fontTimeout = new Promise((resolve) => setTimeout(() => resolve('__font_init_timeout__'), 18000));
    await Promise.race([loadFonts(), fontTimeout]);

    setLoadingProgress(loadingProgressBar, loadingText, 60, '正在渲染界面...');

    // 4) 初始化 UI
    renderRoleManager();
    renderSenderDropdown();
    updateSelfConfig();
    updateTitleToggleButton();
    initSenderDropdownEvents();
    initModalClickOutsideEvents();
    setLoadingProgress(loadingProgressBar, loadingText, 80, '正在恢复对话...');

    // 5) 恢复上次会话
    const lastConversationId = localStorage.getItem('lastConversationId');
    if (lastConversationId && conversations.some(c => c.id === lastConversationId)) {
        await selectConversation(lastConversationId);
    } else if (conversations.length > 0) {
        await selectConversation(conversations[0].id);
    }

    setLoadingProgress(loadingProgressBar, loadingText, 100, '加载完成！');
    setTimeout(() => {
        if (loadingOverlay) loadingOverlay.classList.remove('show');
    }, 300);

    // 监听自己名称输入变化
    const selfNameInput = document.getElementById('selfName');
    if (selfNameInput) {
        selfNameInput.addEventListener('change', (e) => {
            selfConfig.name = e.target.value || '我';
            saveSelfConfig();
            renderSenderDropdown();
            renderRoleManager();
        });
    }

    // 监听自己头像变化
    const selfAvatarInput = document.getElementById('selfAvatarInput');
    if (selfAvatarInput) {
        selfAvatarInput.addEventListener('change', () => {
            const preview = document.getElementById('selfAvatarPreview');
            if (selfAvatarInput.files && selfAvatarInput.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (preview) preview.src = e.target.result;
                    selfConfig.avatar = e.target.result;
                    saveSelfConfig();
                    const dropdownAvatar = document.getElementById('dropdownSelectedAvatar');
                    if (dropdownAvatar) dropdownAvatar.src = e.target.result;
                    renderSenderDropdown();
                    renderRoleManager();
                };
                reader.readAsDataURL(selfAvatarInput.files[0]);
            }
        });
    }
});
