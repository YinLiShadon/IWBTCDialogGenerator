// 角色管理：加载、渲染、增删改

// 获取预设角色的显示名（自定义名优先）
function getPresetDisplayName(originalName) {
    return presetRoleCustomNames[originalName] || originalName;
}

function getPresetOriginalName(role) {
    return role.originalName || role.name;
}

function ensurePresetRoleOriginalName(role) {
    if (!role.originalName) role.originalName = role.name;
    return role;
}

// 加载预设角色
async function loadPresetRoles() {
    presetRoles = [];
    const basePath = 'Character/';
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'];

    // 尝试 fetch 目录（需要服务器开启目录浏览）
    try {
        const response = await fetch(basePath);
        if (response.ok) {
            const text = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            const links = doc.querySelectorAll('a');
            const folders = {};
            const rootImages = [];

            for (const link of links) {
                const href = link.getAttribute('href');
                if (!href || href.startsWith('?') || href === '../') continue;
                if (href.endsWith('/')) {
                    folders[href.replace(/\/$/, '')] = [];
                } else {
                    const ext = href.substring(href.lastIndexOf('.')).toLowerCase();
                    if (imageExtensions.includes(ext)) rootImages.push(href);
                }
            }

            for (const folder of Object.keys(folders)) {
                try {
                    const folderResponse = await fetch(basePath + folder + '/');
                    const folderText = await folderResponse.text();
                    const folderDoc = parser.parseFromString(folderText, 'text/html');
                    const folderLinks = folderDoc.querySelectorAll('a');
                    for (const link of folderLinks) {
                        const href = link.getAttribute('href');
                        if (!href || href.startsWith('?') || href === '../' || href.endsWith('/')) continue;
                        const ext = href.substring(href.lastIndexOf('.')).toLowerCase();
                        if (imageExtensions.includes(ext)) folders[folder].push(href);
                    }
                } catch (e) {
                    console.warn(`读取 ${folder} 文件夹失败:`, e);
                }
            }

            const totalFiles = Object.values(folders).flat().length + rootImages.length;
            if (totalFiles > 0) {
                for (const [folder, files] of Object.entries(folders)) {
                    for (const file of files) {
                        const name = file.replace(/\.[^/.]+$/, '');
                        const avatarPath = basePath + folder + '/' + file;
                        const avatarDataUrl = await imageToDataURL(avatarPath);
                        presetRoles.push({
                            id: `preset_${name}`,
                            name: getPresetDisplayName(name),
                            originalName: name,
                            avatar: avatarDataUrl,
                            type: 'preset',
                            category: folder
                        });
                    }
                }
                for (const file of rootImages) {
                    const name = file.replace(/\.[^/.]+$/, '');
                    const avatarPath = basePath + file;
                    const avatarDataUrl = await imageToDataURL(avatarPath);
                    presetRoles.push({
                        id: `preset_${name}`,
                        name: getPresetDisplayName(name),
                        originalName: name,
                        avatar: avatarDataUrl,
                        type: 'preset',
                        category: '预设角色'
                    });
                }
                return;
            }
        }
    } catch (e) {
        console.warn('Fetch 方式读取失败:', e);
    }

    // fallback：硬编码
    await loadPresetRolesFallback();
}

async function loadPresetRolesFallback() {
    const basePath = 'Character/';
    for (const [folder, files] of Object.entries(PRESET_ROLES_FALLBACK)) {
        for (const file of files) {
            const name = file.replace(/\.[^/.]+$/, '');
            const avatarPath = basePath + folder + '/' + file;
            const avatarDataUrl = await imageToDataURL(avatarPath);
            presetRoles.push({
                id: `preset_${name}`,
                name: getPresetDisplayName(name),
                originalName: name,
                avatar: avatarDataUrl,
                type: 'preset',
                category: folder
            });
        }
    }
}

// 获取发送者头像（根据消息中存储的 sender）
function getAvatarForSender(sender) {
    const defaultAvatar = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'48\' viewBox=\'0 0 48 48\'%3E%3Ccircle cx=\'24\' cy=\'24\' r=\'24\' fill=\'%23666\'/%3E%3C/svg%3E';
    if (sender.avatar && /^data:image\/(png|jpe?g|gif|webp)/.test(sender.avatar)) {
        return sender.avatar;
    }
    if (sender.type === 'preset') {
        const origName = sender.originalName || sender.name;
        const role = presetRoles.find(r => (r.originalName || r.name) === origName);
        if (role && role.avatar && role.avatar.startsWith('data:image')) {
            return role.avatar;
        }
        for (const [folder, files] of Object.entries(PRESET_ROLES_FALLBACK)) {
            for (const file of files) {
                const fileName = file.replace(/\.[^/.]+$/, '');
                if (fileName === origName) {
                    return 'Character/' + folder + '/' + file;
                }
            }
        }
    } else if (sender.type === 'custom') {
        const role = customRoles.find(r => r.id === sender.id);
        if (role && role.avatar) return role.avatar;
    }
    return defaultAvatar;
}

// 渲染角色管理界面
function renderRoleManager() {
    // 自己
    const selfGrid = document.getElementById('selfRolesGrid');
    if (selfGrid) {
        selfGrid.innerHTML = '';
        const selfItem = document.createElement('div');
        selfItem.className = 'role-item';
        const selfTitle = (selfConfig.title && selfConfig.title.text) ? selfConfig.title : null;
        const selfTitleHtml = selfTitle
            ? `<span class="role-title-indicator" style="background-color: ${selfTitle.color};">${escapeHtml(selfTitle.text)}</span>`
            : '';
        selfItem.innerHTML = `
            <img src="${selfConfig.avatar || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'64\' height=\'64\' viewBox=\'0 0 64 64\'%3E%3Ccircle cx=\'32\' cy=\'32\' r=\'32\' fill=\'%23666\'/%3E%3C/svg%3E'}" alt="${selfConfig.name}">
            <span>${selfConfig.name}</span>
            ${selfTitleHtml}
        `;
        selfItem.onclick = () => showEditSelfModal();
        selfGrid.appendChild(selfItem);
    }

    // 旁白
    const narratorGrid = document.getElementById('narratorRolesGrid');
    if (narratorGrid) {
        narratorGrid.innerHTML = '';
        const narratorItem = document.createElement('div');
        narratorItem.className = 'role-item';
        narratorItem.innerHTML = `
            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23888'/%3E%3Ctext x='50%' y='50%' text-anchor='middle' dy='.3em' fill='%23fff' font-size='28'%3E旁%3C/text%3E%3C/svg%3E" alt="旁白">
            <span>旁白</span>
        `;
        narratorItem.onclick = () => showToast('旁白角色不可编辑', 'info');
        narratorGrid.appendChild(narratorItem);
    }

    // 预设角色
    const presetCategoriesContainer = document.getElementById('presetRolesCategories');
    if (presetCategoriesContainer) {
        presetCategoriesContainer.innerHTML = '';
        const presetCategories = {};
        presetRoles.forEach(role => {
            const cat = role.category || '未分类';
            if (!presetCategories[cat]) presetCategories[cat] = [];
            presetCategories[cat].push(role);
        });
        for (const [category, roles] of Object.entries(presetCategories)) {
            const section = document.createElement('div');
            section.className = 'role-category';
            section.innerHTML = `<h4>${category}</h4><div class="role-grid"></div>`;
            const grid = section.querySelector('.role-grid');
            roles.forEach(role => {
                const item = document.createElement('div');
                item.className = 'role-item';
                const title = senderTitles['preset_' + (role.originalName || role.name)];
                const titleHtml = (title && title.text)
                    ? `<span class="role-title-indicator" style="background-color: ${title.color};">${escapeHtml(title.text)}</span>`
                    : '';
                item.innerHTML = `
                    <img src="${role.avatar}" alt="${role.name}">
                    <span title="原名：${role.originalName || role.name}（点击编辑）">${role.name}</span>
                    ${titleHtml}
                `;
                item.onclick = () => showEditPresetRoleModal(role.originalName || role.name);
                grid.appendChild(item);
            });
            presetCategoriesContainer.appendChild(section);
        }
    }

    // 自定义角色
    const customCategoriesContainer = document.getElementById('customRolesCategories');
    if (customCategoriesContainer) {
        customCategoriesContainer.innerHTML = '';
        const customCategories = {};
        customRoles.forEach(role => {
            const cat = role.category || '未分类';
            if (!customCategories[cat]) customCategories[cat] = [];
            customCategories[cat].push(role);
        });
        for (const [category, roles] of Object.entries(customCategories)) {
            const section = document.createElement('div');
            section.className = 'role-category';
            section.innerHTML = `<h4>${category}</h4><div class="role-grid"></div>`;
            const grid = section.querySelector('.role-grid');
            roles.forEach(role => {
                const item = document.createElement('div');
                item.className = 'role-item';
                const title = senderTitles['custom_' + role.id];
                const titleHtml = (title && title.text)
                    ? `<span class="role-title-indicator" style="background-color: ${title.color};">${escapeHtml(title.text)}</span>`
                    : '';
                item.innerHTML = `
                    <img src="${role.avatar}" alt="${role.name}">
                    <span>${role.name}</span>
                    ${titleHtml}
                `;
                item.onclick = () => showEditCustomRoleModal(role.id);
                grid.appendChild(item);
            });
            customCategoriesContainer.appendChild(section);
        }
    }

    renderSenderDropdown();
}

// 角色管理：打开 / 关闭
function showRoleManager() {
    renderRoleManager();
    openModal('roleManagerModal');
}

// 自己配置
function updateSelfConfig() {
    const preview = document.getElementById('selfAvatarPreview');
    if (preview) preview.src = selfConfig.avatar || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' viewBox=\'0 0 32 32\'%3E%3Ccircle cx=\'16\' cy=\'16\' r=\'16\' fill=\'%23666\'/%3E%3C/svg%3E';
    const nameInput = document.getElementById('selfName');
    if (nameInput) nameInput.value = selfConfig.name || '我';
}

function showEditSelfModal() {
    const nameInput = document.getElementById('editSelfName');
    const avatarPreview = document.getElementById('editSelfAvatarPreview');
    if (nameInput) nameInput.value = selfConfig.name || '我';
    if (avatarPreview) avatarPreview.src = selfConfig.avatar || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'64\' height=\'64\' viewBox=\'0 0 64 64\'%3E%3Ccircle cx=\'32\' cy=\'32\' r=\'32\' fill=\'%23666\'/%3E%3C/svg%3E';
    setEditingTitle(selfConfig.title ? selfConfig.title.text : '', selfConfig.title ? selfConfig.title.color : '#FF6B6B');
    refreshEditingTitleUI();
    openModal('editSelfModal');
}

function onEditSelfAvatarChange() {
    const input = document.getElementById('editSelfAvatarInput');
    const preview = document.getElementById('editSelfAvatarPreview');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.src = e.target.result;
            editSelfAvatarData = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function saveSelfEdit() {
    const name = document.getElementById('editSelfName').value.trim() || '我';
    selfConfig.name = name;
    if (editSelfAvatarData) selfConfig.avatar = editSelfAvatarData;
    // 保存头衔
    selfConfig.title = { text: editingTitle.text, color: editingTitle.color };
    setTitleForSender({ type: 'self' }, selfConfig.title);
    saveSelfConfig();
    updateSelfConfig();
    renderSenderDropdown();
    renderRoleManager();
    closeModal('editSelfModal');
    showToast('保存成功', 'success');
    editSelfAvatarData = null;
}

// 预设角色：编辑 / 还原默认名
function showEditPresetRoleModal(originalName) {
    const role = presetRoles.find(r => (r.originalName || r.name) === originalName);
    if (!role) return;
    editingPresetRoleOriginalName = originalName;
    document.getElementById('editPresetRoleName').value = role.name;
    document.getElementById('presetOriginalName').textContent = `原名：${originalName}`;
    document.getElementById('editPresetRoleAvatarPreview').src = role.avatar || '';
    // 加载头衔
    const existingTitle = senderTitles['preset_' + originalName] || { text: '', color: '#FF6B6B' };
    setEditingTitle(existingTitle.text, existingTitle.color);
    refreshEditingTitleUI();
    openModal('editPresetRoleModal');
}

function savePresetRoleEdit() {
    const newName = document.getElementById('editPresetRoleName').value.trim();
    if (!newName || !editingPresetRoleOriginalName) return;
    presetRoleCustomNames[editingPresetRoleOriginalName] = newName;
    savePresetRoleCustomNames();
    presetRoles.forEach(r => {
        if ((r.originalName || r.name) === editingPresetRoleOriginalName) {
            r.name = newName;
        }
    });
    conversations.forEach(conv => {
        if (conv.messages) {
            conv.messages.forEach(msg => {
                if (msg.sender && msg.sender.type === 'preset' && (msg.sender.originalName || msg.sender.name) === editingPresetRoleOriginalName) {
                    msg.sender.name = newName;
                }
            });
        }
    });
    // 保存头衔
    setTitleForSender({ type: 'preset', originalName: editingPresetRoleOriginalName }, editingTitle);
    saveConversations();
    renderRoleManager();
    renderMessages();
    closeModal('editPresetRoleModal');
    showToast('保存成功', 'success');
}

function resetPresetRoleName() {
    if (!editingPresetRoleOriginalName) return;
    delete presetRoleCustomNames[editingPresetRoleOriginalName];
    savePresetRoleCustomNames();
    presetRoles.forEach(r => {
        if ((r.originalName || r.name) === editingPresetRoleOriginalName) {
            r.name = r.originalName;
        }
    });
    conversations.forEach(conv => {
        if (conv.messages) {
            conv.messages.forEach(msg => {
                if (msg.sender && msg.sender.type === 'preset' && (msg.sender.originalName || msg.sender.name) === editingPresetRoleOriginalName) {
                    msg.sender.name = msg.sender.originalName || msg.sender.name;
                }
            });
        }
    });
    saveConversations();
    renderRoleManager();
    renderMessages();
    closeModal('editPresetRoleModal');
    showToast('已还原默认名', 'success');
}

// 自定义角色：编辑 / 删除
function showEditCustomRoleModal(roleId) {
    const role = customRoles.find(r => r.id === roleId);
    if (!role) return;
    editingCustomRoleId = roleId;
    editCustomRoleAvatarData = null;
    document.getElementById('editCustomRoleName').value = role.name;
    document.getElementById('editCustomRoleCategory').value = role.category || '';
    document.getElementById('editCustomRoleAvatarPreview').src = role.avatar;
    const existingTitle = senderTitles['custom_' + roleId] || { text: '', color: '#FF6B6B' };
    setEditingTitle(existingTitle.text, existingTitle.color);
    refreshEditingTitleUI();
    openModal('editCustomRoleModal');
}

function onEditCustomRoleAvatarChange() {
    const input = document.getElementById('editCustomRoleAvatarInput');
    const preview = document.getElementById('editCustomRoleAvatarPreview');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.src = e.target.result;
            editCustomRoleAvatarData = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function saveCustomRoleEdit() {
    const name = document.getElementById('editCustomRoleName').value.trim();
    const category = document.getElementById('editCustomRoleCategory').value.trim() || '未分类';
    if (!name || !editingCustomRoleId) return;
    const roleIndex = customRoles.findIndex(r => r.id === editingCustomRoleId);
    if (roleIndex === -1) return;
    customRoles[roleIndex].name = name;
    customRoles[roleIndex].category = category;
    if (editCustomRoleAvatarData) {
        customRoles[roleIndex].avatar = editCustomRoleAvatarData;
    }
    setTitleForSender({ type: 'custom', id: editingCustomRoleId }, editingTitle);
    saveCustomRoles();
    renderRoleManager();
    closeModal('editCustomRoleModal');
    showToast('保存成功', 'success');
    editingCustomRoleId = null;
    editCustomRoleAvatarData = null;
}

function confirmDeleteCustomRole() {
    if (!editingCustomRoleId) return;
    showConfirmDialog('确认删除', '确定要删除此角色吗？').then((confirmed) => {
        if (confirmed) {
            removeTitleForSender({ type: 'custom', id: editingCustomRoleId });
            customRoles = customRoles.filter(r => r.id !== editingCustomRoleId);
            saveCustomRoles();
            renderRoleManager();
            closeModal('editCustomRoleModal');
            showToast('删除成功', 'success');
            editingCustomRoleId = null;
        }
    });
}

// 创建自定义角色
function toggleCreateRoleForm() {
    document.getElementById('createRoleForm').classList.toggle('active');
}

function onNewRoleAvatarChange() {
    const input = document.getElementById('newRoleAvatarInput');
    const preview = document.getElementById('newRoleAvatarPreview');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function createCustomRole() {
    const name = document.getElementById('newRoleName').value.trim();
    const category = document.getElementById('newRoleCategory').value.trim() || '未分类';
    const avatarPreview = document.getElementById('newRoleAvatarPreview').src;
    if (!name) return;
    const role = {
        id: 'custom_' + Date.now(),
        name: name,
        avatar: avatarPreview,
        type: 'custom',
        category: category
    };
    customRoles.push(role);
    saveCustomRoles();
    renderRoleManager();
    document.getElementById('newRoleName').value = '';
    document.getElementById('newRoleCategory').value = '';
    document.getElementById('createRoleForm').classList.remove('active');
}

// 头衔编辑 UI 辅助（编辑模态框中输入框 + 颜色按钮的同步）
function refreshEditingTitleUI() {
    // self / preset / custom 三种模态框都使用相同 id
    const textInput = document.getElementById('editTitleText');
    const colorBtn = document.getElementById('editTitleColorBtn');
    if (textInput) textInput.value = editingTitle.text || '';
    if (colorBtn) {
        colorBtn.style.backgroundColor = editingTitle.color || '#FF6B6B';
    }
}

function onEditingTitleTextChange(value) {
    editingTitle.text = value;
}

function onEditingTitleColorChange(color) {
    editingTitle.color = color;
    refreshEditingTitleUI();
}
