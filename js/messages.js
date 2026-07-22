// 消息：渲染、发送、删除、撤销、重做、选择模式

// 渲染消息
function renderMessages() {
    const container = document.getElementById('messagesContainer');
    if (!container) return;
    const conv = conversations.find(c => c.id === currentConversationId);
    if (!conv || !conv.messages || conv.messages.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>开始发送消息吧</p></div>';
        return;
    }

    const fragment = document.createDocumentFragment();

    conv.messages.forEach(msg => {
        const wrapper = document.createElement('div');
        wrapper.className = 'message-wrapper';
        wrapper.dataset.msgId = msg.id;

        if (msg.type === 'dialog-title') {
            wrapper.classList.add('dialog-title-message');
            const checkboxHtml = messageSelectionMode ? `<input type="checkbox" class="message-checkbox" ${selectedMessages.has(msg.id) ? 'checked' : ''} onchange="toggleMessageSelection('${msg.id}')">` : '';
            wrapper.innerHTML = `
                ${checkboxHtml}
                <div class="dialog-title-bubble" onclick="startEditDialogTitle('${msg.id}')" title="单击编辑">${escapeHtml(msg.content || '（无标题）')}</div>
                ${!messageSelectionMode ? `<button class="message-delete-btn" onclick="deleteMessage('${msg.id}').catch(console.error)" style="color: #cce4f5;">🗑️</button>` : ''}
            `;
        } else if (msg.sender.type === 'narrator') {
            wrapper.classList.add('narrator');
            const checkboxHtml = messageSelectionMode ? `<input type="checkbox" class="message-checkbox" ${selectedMessages.has(msg.id) ? 'checked' : ''} onchange="toggleMessageSelection('${msg.id}')">` : '';
            wrapper.innerHTML = `
                ${checkboxHtml}
                <div class="message-bubble" style="white-space: pre-wrap;">${msg.content}</div>
                ${!messageSelectionMode ? `<button class="message-delete-btn" onclick="deleteMessage('${msg.id}').catch(console.error)">🗑️</button>` : ''}
            `;
        } else if (msg.sender.type === 'self') {
            wrapper.classList.add('self');
            const avatar = selfConfig.avatar || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'48\' viewBox=\'0 0 48 48\'%3E%3Ccircle cx=\'24\' cy=\'24\' r=\'24\' fill=\'%23666\'/%3E%3C/svg%3E';
            const checkboxHtml = messageSelectionMode ? `<input type="checkbox" class="message-checkbox" ${selectedMessages.has(msg.id) ? 'checked' : ''} onchange="toggleMessageSelection('${msg.id}')">` : '';
            const titleHtml = renderTitleHtml(msg.sender, 'left');
            const senderNameHtml = msg.sender.name !== '我'
                ? `<div class="message-sender">${titleHtml}${escapeHtml(msg.sender.name)}</div>`
                : (titleHtml ? `<div class="message-sender">${titleHtml}</div>` : '');
            wrapper.innerHTML = `
                ${checkboxHtml}
                <img class="message-avatar" src="${avatar}" alt="">
                <div class="message-content-wrapper">
                    ${senderNameHtml}
                    <div class="message-bubble">
                        <div class="message-content">${msg.content || ''}</div>
                        ${renderFiles(msg.files)}
                    </div>
                    <div class="message-time">${formatTime(msg.timestamp)}</div>
                </div>
                ${!messageSelectionMode ? `<button class="message-delete-btn" onclick="deleteMessage('${msg.id}').catch(console.error)">🗑️</button>` : ''}
            `;
        } else {
            if (msg.sender.type === 'preset' || msg.sender.type === 'custom') {
                wrapper.classList.add('role');
            }
            const checkboxHtml = messageSelectionMode ? `<input type="checkbox" class="message-checkbox" ${selectedMessages.has(msg.id) ? 'checked' : ''} onchange="toggleMessageSelection('${msg.id}')">` : '';
            const titleHtml = renderTitleHtml(msg.sender);
            wrapper.innerHTML = `
                ${!messageSelectionMode ? `<button class="message-delete-btn" onclick="deleteMessage('${msg.id}').catch(console.error)">🗑️</button>` : ''}
                ${checkboxHtml}
                <img class="message-avatar" src="${getAvatarForSender(msg.sender)}" alt="">
                <div class="message-content-wrapper">
                    <div class="message-sender">${escapeHtml(msg.sender.name)}${titleHtml}</div>
                    <div class="message-bubble">
                        <div class="message-content">${msg.content || ''}</div>
                        ${renderFiles(msg.files)}
                    </div>
                    <div class="message-time">${formatTime(msg.timestamp)}</div>
                </div>
            `;
        }

        fragment.appendChild(wrapper);
    });

    container.innerHTML = '';
    container.appendChild(fragment);

    container.querySelectorAll('.previewable-image').forEach(img => {
        img.addEventListener('click', () => {
            const previewSrc = decodeURIComponent(img.dataset.preview);
            showImagePreview(previewSrc);
        });
    });

    requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
    });
}

// 渲染文件
function renderFiles(files) {
    if (!files || files.length === 0) return '';
    let html = '';
    files.forEach(file => {
        if (file.type && file.type.startsWith('image/')) {
            html += `<div class="message-file"><img src="${file.data}" alt="${file.name}" data-preview="${encodeURIComponent(file.data)}" class="previewable-image"></div>`;
        } else {
            html += `<div class="message-file"><span>📄</span><a href="${file.data}" download="${file.name}">${file.name}</a></div>`;
        }
    });
    return html;
}

// 双击编辑小对话标题
function startEditDialogTitle(msgId) {
    const conv = conversations.find(c => c.id === currentConversationId);
    if (!conv) return;
    const msg = conv.messages.find(m => m.id === msgId);
    if (!msg) return;
    const wrapper = document.querySelector(`[data-msg-id="${msgId}"]`);
    if (!wrapper) return;
    const bubble = wrapper.querySelector('.dialog-title-bubble');
    if (!bubble) return;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'dialog-title-edit-input';
    input.value = msg.content || '';
    const save = () => {
        const newVal = input.value.trim() || '（无标题）';
        msg.content = newVal;
        saveConversations();
        renderMessages();
    };
    input.addEventListener('blur', save);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            input.blur();
        } else if (e.key === 'Escape') {
            renderMessages();
        }
    });
    bubble.replaceWith(input);
    input.focus();
    input.select();
}

// 删除 / 撤销 / 重做
async function deleteMessage(msgId) {
    const confirmed = await showConfirmDialog('删除消息', '确定删除此消息？删除后可撤销恢复。');
    if (!confirmed) return;
    const conv = conversations.find(c => c.id === currentConversationId);
    if (!conv || !conv.messages) return;
    const msgIndex = conv.messages.findIndex(m => m.id === msgId);
    if (msgIndex === -1) return;
    const deletedMsg = conv.messages.splice(msgIndex, 1)[0];
    deletedMessages.push({ convId: currentConversationId, message: deletedMsg, index: msgIndex });
    redoMessages = [];
    saveConversations();
    renderMessages();
    showToast('消息已删除', 'info');
}

function undoDelete() {
    if (deletedMessages.length === 0) {
        showToast('没有可撤销的操作', 'info');
        return;
    }
    const lastDeleted = deletedMessages.pop();
    const conv = conversations.find(c => c.id === lastDeleted.convId);
    if (!conv) {
        showToast('撤销失败：对话不存在', 'error');
        return;
    }
    if (!conv.messages) conv.messages = [];
    if (lastDeleted.isSent) {
        const msgIndex = conv.messages.findIndex(m => m.id === lastDeleted.message.id);
        if (msgIndex !== -1) {
            conv.messages.splice(msgIndex, 1);
            redoMessages.push(lastDeleted);
        }
    } else {
        let insertIndex = conv.messages.findIndex(m => m.timestamp > lastDeleted.message.timestamp);
        if (insertIndex === -1) insertIndex = conv.messages.length;
        conv.messages.splice(insertIndex, 0, lastDeleted.message);
        redoMessages.push(lastDeleted);
    }
    saveConversations();
    if (lastDeleted.convId === currentConversationId) renderMessages();
    showToast('消息已撤销', 'success');
}

function redoDelete() {
    if (redoMessages.length === 0) {
        showToast('没有可重做的操作', 'info');
        return;
    }
    const lastRedo = redoMessages.pop();
    const conv = conversations.find(c => c.id === lastRedo.convId);
    if (!conv) {
        showToast('重做失败：对话不存在', 'error');
        return;
    }
    if (lastRedo.isSent) {
        let insertIndex = conv.messages.findIndex(m => m.timestamp > lastRedo.message.timestamp);
        if (insertIndex === -1) insertIndex = conv.messages.length;
        conv.messages.splice(insertIndex, 0, lastRedo.message);
        deletedMessages.push(lastRedo);
    } else {
        const msgIndex = conv.messages.findIndex(m => m.id === lastRedo.message.id);
        if (msgIndex !== -1) {
            conv.messages.splice(msgIndex, 1);
            deletedMessages.push(lastRedo);
        }
    }
    saveConversations();
    if (lastRedo.convId === currentConversationId) renderMessages();
    showToast('消息已恢复', 'success');
}

// 多选模式
function toggleMessageSelectionMode() {
    messageSelectionMode = !messageSelectionMode;
    selectedMessages.clear();
    renderMessages();
    updateMessageSelectionUI();
}

function updateMessageSelectionUI() {
    let toolbar = document.getElementById('messageSelectionToolbar');
    if (!toolbar) {
        toolbar = document.createElement('div');
        toolbar.id = 'messageSelectionToolbar';
        toolbar.className = 'selection-toolbar';
        const messagesContainer = document.getElementById('messagesContainer');
        if (messagesContainer && messagesContainer.parentNode) {
            messagesContainer.parentNode.insertBefore(toolbar, messagesContainer);
        }
    }
    toolbar.style.display = messageSelectionMode ? 'flex' : 'none';
    toolbar.innerHTML = `
        <span style="color: var(--text-color);">已选择 ${selectedMessages.size} 条消息</span>
        <button class="btn-delete-selected" onclick="deleteSelectedMessages()" style="background: #ff6b6b; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">🗑️ 删除</button>
        <button class="btn-cancel-selection" onclick="toggleMessageSelectionMode()" style="background: #666; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">✕ 取消</button>
    `;
}

function toggleMessageSelection(msgId) {
    if (selectedMessages.has(msgId)) {
        selectedMessages.delete(msgId);
    } else {
        selectedMessages.add(msgId);
    }
    const wrapper = document.querySelector(`[data-msg-id="${msgId}"]`);
    if (wrapper) {
        const checkbox = wrapper.querySelector('.message-checkbox');
        if (checkbox) checkbox.checked = selectedMessages.has(msgId);
    }
    updateMessageSelectionUI();
}

async function deleteSelectedMessages() {
    if (selectedMessages.size === 0) return;
    const confirmed = await showConfirmDialog('删除消息', `确定删除选中的 ${selectedMessages.size} 条消息？`);
    if (!confirmed) return;
    const conv = conversations.find(c => c.id === currentConversationId);
    if (!conv) return;
    const deletedMsgs = [];
    const indicesToDelete = [];
    selectedMessages.forEach(msgId => {
        const msgIndex = conv.messages.findIndex(m => m.id === msgId);
        if (msgIndex !== -1) {
            indicesToDelete.push(msgIndex);
            deletedMsgs.push({ message: conv.messages[msgIndex], index: msgIndex });
        }
    });
    indicesToDelete.sort((a, b) => b - a).forEach(idx => {
        conv.messages.splice(idx, 1);
    });
    deletedMessages.push(...deletedMsgs.map(d => ({ convId: currentConversationId, message: d.message, index: d.index })));
    redoMessages = [];
    saveConversations();
    messageSelectionMode = false;
    selectedMessages.clear();
    renderMessages();
    updateMessageSelectionUI();
    showToast(`已删除 ${deletedMsgs.length} 条消息`, 'info');
}

// 发送消息
async function sendMessage() {
    const inputEl = document.getElementById('messageInput');
    const rawValue = inputEl.value;
    const content = rawValue.replace(/<[^>]*>/g, '').trim();
    const contentHtml = rawValue.trim();
    if (!content && selectedFiles.length === 0) {
        showToast('请输入消息内容', 'info');
        return;
    }
    if (!currentConversationId) {
        const conv = {
            id: 'conv_' + Date.now(),
            name: '新对话',
            messages: [],
            createdAt: Date.now()
        };
        conversations.unshift(conv);
        currentConversationId = conv.id;
        document.getElementById('chatTitleInput').value = conv.name;
    }

    let sender;
    if (currentSenderValue === 'self') {
        sender = {
            type: 'self',
            name: selfConfig.name || '我',
            avatar: selfConfig.avatar
        };
    } else if (currentSenderValue === 'narrator') {
        sender = {
            type: 'narrator',
            name: '旁白',
            avatar: ''
        };
    } else if (currentSenderValue.startsWith('preset_')) {
        const roleName = currentSenderValue.replace('preset_', '');
        const role = presetRoles.find(r => (r.originalName || r.name) === roleName);
        if (role) {
            sender = {
                type: 'preset',
                name: role.name,
                originalName: role.originalName || role.name,
                avatar: role.avatar
            };
        }
    } else if (currentSenderValue.startsWith('custom_')) {
        const roleId = currentSenderValue.replace('custom_', '');
        const role = customRoles.find(r => r.id === roleId);
        if (role) {
            sender = {
                type: 'custom',
                id: role.id,
                name: role.name,
                avatar: role.avatar
            };
        }
    }
    if (!sender) return;

    let fileDataArray = [];
    try {
        if (selectedFiles.length > 0) {
            const isLargeFile = selectedFiles.some(f => f.size > 5 * 1024 * 1024);
            if (isLargeFile) {
                showToast(`正在处理 ${selectedFiles.length} 个文件，请稍候...`, 'info');
            }
            fileDataArray = await new Promise((resolve, reject) => {
                const results = [];
                let completed = 0;
                let errors = 0;
                const processFile = (index) => {
                    if (index >= selectedFiles.length) {
                        if (errors > 0 && completed === 0) {
                            reject(new Error('文件处理失败'));
                        } else {
                            resolve(results);
                        }
                        return;
                    }
                    const file = selectedFiles[index];
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        results.push({
                            name: file.name,
                            type: file.type,
                            data: e.target.result
                        });
                        completed++;
                        if (completed % 5 === 0 || completed === selectedFiles.length) {
                            requestAnimationFrame(() => processFile(index + 1));
                        } else {
                            processFile(index + 1);
                        }
                    };
                    reader.onerror = () => {
                        errors++;
                        processFile(index + 1);
                    };
                    reader.readAsDataURL(file);
                };
                processFile(0);
            });
            if (isLargeFile && fileDataArray.length > 0) {
                showToast('文件处理完成，正在发送...', 'info');
            }
        }
    } catch (err) {
        console.error('文件处理错误:', err);
        showToast('文件处理失败', 'error');
        return;
    }

    const message = {
        id: 'msg_' + Date.now(),
        type: contentHtml && fileDataArray.length > 0 ? 'mixed' : (fileDataArray.length > 0 ? 'file' : 'text'),
        sender: sender,
        content: contentHtml,
        files: fileDataArray,
        timestamp: Date.now()
    };
    const conv = conversations.find(c => c.id === currentConversationId);
    if (conv) {
        if (!conv.messages) conv.messages = [];
        conv.messages.push(message);
        deletedMessages.push({ convId: conv.id, message: message, isSent: true });
        saveConversations();
        renderMessages();
    }
    document.getElementById('messageInput').value = '';
    document.getElementById('messageInput').style.height = 'auto';
    document.getElementById('messageInput').rows = 1;
    filePreviewCache.forEach(url => URL.revokeObjectURL(url));
    filePreviewCache.clear();
    selectedFiles = [];
    document.getElementById('filePreview').innerHTML = '';
}
