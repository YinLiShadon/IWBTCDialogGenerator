// 发送者下拉框逻辑

// 渲染发送者下拉框
function renderSenderDropdown() {
    const menu = document.getElementById('senderDropdownMenu');
    if (!menu) return;
    const defaultAvatar = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'28\' height=\'28\' viewBox=\'0 0 48 48\'%3E%3Ccircle cx=\'24\' cy=\'24\' r=\'24\' fill=\'%23666\'/%3E%3C/svg%3E';
    const narratorAvatar = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'28\' height=\'28\' viewBox=\'0 0 48 48\'%3E%3Crect width=\'48\' height=\'48\' fill=\'%23888\'/%3E%3Ctext x=\'50%\' y=\'50%\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%23fff\' font-size=\'20\'%3E旁%3C/text%3E%3C/svg%3E';

    let html = '';

    // 自己
    html += `<div class="dropdown-group-label">自己</div>`;
    html += `<div class="dropdown-option" data-value="self" data-name="自己" data-avatar="${selfConfig.avatar || defaultAvatar}">`;
    html += `<img src="${selfConfig.avatar || defaultAvatar}" alt="">`;
    html += `<span>自己</span></div>`;

    // 旁白
    html += `<div class="dropdown-group-label">旁白</div>`;
    html += `<div class="dropdown-option" data-value="narrator" data-name="旁白" data-avatar="${narratorAvatar}">`;
    html += `<img src="${narratorAvatar}" alt="">`;
    html += `<span>旁白</span></div>`;

    // 预设角色
    if (presetRoles.length > 0) {
        const presetCategories = {};
        presetRoles.forEach(role => {
            const cat = role.category || '未分类';
            if (!presetCategories[cat]) presetCategories[cat] = [];
            presetCategories[cat].push(role);
        });
        for (const [category, roles] of Object.entries(presetCategories)) {
            html += `<div class="dropdown-group-label">预设 - ${category}</div>`;
            roles.forEach(role => {
                html += `<div class="dropdown-option" data-value="preset_${role.originalName || role.name}" data-name="${role.name}" data-avatar="${role.avatar}">`;
                html += `<img src="${role.avatar}" alt="">`;
                html += `<span>${role.name}</span></div>`;
            });
        }
    }

    // 自定义角色
    if (customRoles.length > 0) {
        const customCategories = {};
        customRoles.forEach(role => {
            const cat = role.category || '未分类';
            if (!customCategories[cat]) customCategories[cat] = [];
            customCategories[cat].push(role);
        });
        for (const [category, roles] of Object.entries(customCategories)) {
            html += `<div class="dropdown-group-label">自定义 - ${category}</div>`;
            roles.forEach(role => {
                html += `<div class="dropdown-option" data-value="custom_${role.id}" data-name="${role.name}" data-avatar="${role.avatar}">`;
                html += `<img src="${role.avatar}" alt="">`;
                html += `<span>${role.name}</span></div>`;
            });
        }
    }

    menu.innerHTML = html;

    menu.querySelectorAll('.dropdown-option').forEach(option => {
        option.addEventListener('click', function(e) {
            e.stopPropagation();
            const value = this.dataset.value;
            const name = this.dataset.name;
            const avatar = this.dataset.avatar;
            selectSenderOption(value, name, avatar);
        });
    });
}

// 切换下拉框
function toggleSenderDropdown(e) {
    e.stopPropagation();
    const dropdown = document.getElementById('senderDropdown');
    if (dropdown) dropdown.classList.toggle('open');
}

// 选择下拉框选项
function selectSenderOption(value, text, avatar) {
    document.getElementById('senderSelect').value = value;
    document.getElementById('dropdownSelectedText').textContent = text;
    document.getElementById('dropdownSelectedAvatar').src = avatar;
    currentSenderValue = value;

    document.querySelectorAll('.dropdown-option').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.value === value);
    });
    document.getElementById('senderDropdown').classList.remove('open');
    onSenderChange();
}

// 发送者变化（兼容 select 的 onchange）
function onSenderChange() {
    const select = document.getElementById('senderSelect');
    const selfConfigEl = document.getElementById('selfConfig');
    if (!select || !selfConfigEl) return;
    const value = select.value;
    selfConfigEl.style.display = (value === 'self') ? 'flex' : 'none';
}

// 移动端触摸支持 + 外部点击关闭
function initSenderDropdownEvents() {
    const dropdownTrigger = document.querySelector('.custom-dropdown-trigger');
    if (dropdownTrigger) {
        dropdownTrigger.addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            lastTouchTime = Date.now();
            const dropdown = document.getElementById('senderDropdown');
            if (dropdown) dropdown.classList.toggle('open');
        });
    }
    document.addEventListener('click', (e) => {
        if (Date.now() - lastTouchTime < 500) return;
        const dropdown = document.getElementById('senderDropdown');
        if (dropdown && !dropdown.contains(e.target)) {
            dropdown.classList.remove('open');
        }
    });
    const menu = document.getElementById('senderDropdownMenu');
    if (menu) {
        menu.addEventListener('click', (e) => e.stopPropagation());
    }
}
