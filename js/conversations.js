// 对话（会话）管理

function showNewChatModal() {
    document.getElementById('newChatModal').classList.add('active');
    document.getElementById('newChatName').value = '';
    document.getElementById('newChatName').focus();
}

function createConversation() {
    const name = document.getElementById('newChatName').value.trim();
    if (!name) return;
    const conv = {
        id: 'conv_' + Date.now(),
        name: name,
        messages: [],
        createdAt: Date.now()
    };
    conversations.unshift(conv);
    saveConversations();
    closeModal('newChatModal');
    selectConversation(conv.id);
}

async function selectConversation(id) {
    if (selectedFiles.length > 0) {
        const confirmed = await showConfirmDialog('切换对话', '当前有未发送的文件，切换对话将清除这些文件，确定要切换吗？');
        if (!confirmed) return;
        filePreviewCache.forEach(url => URL.revokeObjectURL(url));
        filePreviewCache.clear();
        selectedFiles = [];
        renderFilePreview();
    }
    currentConversationId = id;
    localStorage.setItem('lastConversationId', id);
    renderMessages();
    const conv = conversations.find(c => c.id === id);
    document.getElementById('chatTitleInput').value = conv ? conv.name : 'IWBTC Dialog Generator';
    showToast(`已加载对话：${conv.name}`, 'info');
}

function handleTitleKeydown(event) {
    if (event.key === 'Enter') {
        event.target.blur();
    }
}

function handleTitleBlur() {
    const newName = document.getElementById('chatTitleInput').value.trim();
    if (!newName) {
        document.getElementById('chatTitleInput').value = 'IWBTC Dialog Generator';
    }
    if (currentConversationId) {
        const conv = conversations.find(c => c.id === currentConversationId);
        if (conv) {
            conv.name = newName || 'IWBTC Dialog Generator';
            saveConversations();
        }
    }
}

async function resetCurrentConversation() {
    if (!currentConversationId) {
        showToast('请先选择一个对话', 'error');
        return;
    }
    const confirmed = await showConfirmDialog('重置', '确定要重置当前对话吗？对话名称和所有消息都将清空，且无法恢复！');
    if (!confirmed) return;
    const conv = conversations.find(c => c.id === currentConversationId);
    if (conv) {
        conv.messages = [];
        conv.name = 'IWBTC Dialog Generator';
        saveConversations();
        document.getElementById('chatTitleInput').value = conv.name;
        renderMessages();
        showToast('对话已重置', 'success');
    }
}

async function deleteConversation(id, event) {
    if (event) event.stopPropagation();
    const confirmed = await showConfirmDialog('删除对话', '确定删除此对话？删除后无法恢复。');
    if (!confirmed) return;
    conversations = conversations.filter(c => c.id !== id);
    saveConversations();
    if (currentConversationId === id || conversations.length === 0) {
        currentConversationId = null;
        document.getElementById('chatTitleInput').value = 'IWBTC Dialog Generator';
    }
    showToast('对话已删除', 'success');
}

function renameConversation(id) {
    const conv = conversations.find(c => c.id === id);
    if (!conv) return;
    const newName = prompt('请输入新的对话名称：', conv.name);
    if (newName && newName.trim()) {
        conv.name = newName.trim();
        saveConversations();
        if (currentConversationId === id) {
            document.getElementById('chatTitleInput').value = conv.name;
        }
        showToast('对话已重命名', 'success');
    }
}
