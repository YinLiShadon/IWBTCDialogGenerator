// 输入处理、文本格式化、文件选择、键盘快捷键

function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey) {
        event.preventDefault();
        sendMessage().catch(console.error);
    }
}

// 全局键盘快捷键：Ctrl+Z / Ctrl+Y
document.addEventListener('keydown', function(event) {
    if (event.ctrlKey || event.metaKey) {
        if (event.key === 'z' || event.key === 'Z') {
            event.preventDefault();
            undoDelete();
        } else if (event.key === 'y' || event.key === 'Y') {
            event.preventDefault();
            redoDelete();
        }
    }
});

// 文件选择
function onFileSelect() {
    const input = document.getElementById('fileInput');
    selectedFiles = Array.from(input.files);
    renderFilePreview();
}

function renderFilePreview() {
    const preview = document.getElementById('filePreview');
    if (!preview) return;
    preview.innerHTML = '';
    selectedFiles.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'file-preview-item';
        if (file.type && file.type.startsWith('image/')) {
            let dataUrl = filePreviewCache.get(file);
            if (!dataUrl) {
                dataUrl = URL.createObjectURL(file);
                filePreviewCache.set(file, dataUrl);
            }
            item.innerHTML = `
                <img src="${dataUrl}" alt="${file.name}" style="cursor: pointer;">
                <span class="remove-file" onclick="event.stopPropagation(); confirmRemoveFile(${index})">✕</span>
            `;
            const img = item.querySelector('img');
            if (img) img.onclick = () => showImagePreview(dataUrl);
        } else {
            item.innerHTML = `
                <div class="file-icon">📄 ${file.name}</div>
                <span class="remove-file" onclick="confirmRemoveFile(${index})">✕</span>
            `;
        }
        preview.appendChild(item);
    });
}

async function confirmRemoveFile(index) {
    const confirmed = await showConfirmDialog('删除文件', '确定要删除此文件吗？');
    if (confirmed) {
        const file = selectedFiles[index];
        if (filePreviewCache.has(file)) {
            URL.revokeObjectURL(filePreviewCache.get(file));
            filePreviewCache.delete(file);
        }
        selectedFiles.splice(index, 1);
        renderFilePreview();
    }
}

// 文字格式：B / I / U / S / mosaic
function toggleTextFormat(format) {
    const input = document.getElementById('messageInput');
    if (!input) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;

    if (format === 'mosaic') {
        applyMosaicToSelected();
        return;
    }
    if (start === end) {
        showToast('请先选择要格式化的文字', 'info');
        return;
    }
    const selected = input.value.substring(start, end);
    const tagMap = {
        bold: { open: '<b>', close: '</b>' },
        italic: { open: '<i>', close: '</i>' },
        underline: { open: '<u>', close: '</u>' },
        strikethrough: { open: '<s>', close: '</s>' }
    };
    const tags = tagMap[format];
    if (!tags) return;
    const before = input.value.substring(Math.max(0, start - tags.open.length), start);
    const after = input.value.substring(end, Math.min(input.value.length, end + tags.close.length));
    if (before === tags.open && after === tags.close) {
        const newValue = input.value.substring(0, start - tags.open.length) + selected + input.value.substring(end + tags.close.length);
        input.value = newValue;
        input.setSelectionRange(start - tags.open.length, end - tags.open.length);
    } else {
        const newValue = input.value.substring(0, start) + tags.open + selected + tags.close + input.value.substring(end);
        input.value = newValue;
        input.setSelectionRange(start + tags.open.length, end + tags.open.length);
    }
}

// 应用文字颜色（由颜色选择器弹窗确认后调用）
function applyTextColor(color) {
    const input = document.getElementById('messageInput');
    if (!input) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const selected = input.value.substring(start, end);
    if (start === end) {
        showToast('请先选择要设置颜色的文字', 'info');
        return;
    }
    const openTag = `<span style="color: ${color};">`;
    const closeTag = '</span>';
    const newValue = input.value.substring(0, start) + openTag + selected + closeTag + input.value.substring(end);
    input.value = newValue;
    input.setSelectionRange(start + openTag.length, end + openTag.length);
}

// 重置文字格式
function resetTextFormat() {
    const input = document.getElementById('messageInput');
    if (!input) return;
    input.value = input.value.replace(/<\/?(b|i|u|s|span)[^>]*>/g, '');
    textFormatState.mosaic = false;
    updateFormatButtonState('mosaic', false);
    showToast('已清除格式', 'info');
}

function updateFormatButtonState(format, isActive) {
    const btn = document.querySelector(`.format-btn[data-format="${format}"]`);
    if (btn) btn.classList.toggle('active', isActive);
}

function applyMosaicToSelected() {
    const input = document.getElementById('messageInput');
    if (!input) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const selected = input.value.substring(start, end);
    if (start === end) {
        showToast('请先选择要打马赛克的文字', 'info');
        return;
    }
    const openTag = '<span class="mosaic-text">';
    const closeTag = '</span>';
    const newValue = input.value.substring(0, start) + openTag + selected + closeTag + input.value.substring(end);
    input.value = newValue;
    input.setSelectionRange(start + openTag.length, end + openTag.length);
}

// 插入小对话标题
function insertDialogTitle() {
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
    const inputEl = document.getElementById('insertDialogTitleInput');
    if (inputEl) inputEl.value = '';
    openModal('insertDialogTitleModal');
    setTimeout(() => inputEl && inputEl.focus(), 50);
}

function confirmInsertDialogTitle() {
    const title = (document.getElementById('insertDialogTitleInput').value || '').trim();
    if (!title) {
        showToast('请输入小标题文字', 'info');
        return;
    }
    const conv = conversations.find(c => c.id === currentConversationId);
    if (!conv) return;
    if (!conv.messages) conv.messages = [];
    const message = {
        id: 'msg_' + Date.now(),
        type: 'dialog-title',
        sender: { type: 'system', name: 'title' },
        content: title,
        files: [],
        timestamp: Date.now()
    };
    conv.messages.push(message);
    deletedMessages.push({ convId: conv.id, message: message, isSent: true });
    saveConversations();
    renderMessages();
    closeModal('insertDialogTitleModal');
}
