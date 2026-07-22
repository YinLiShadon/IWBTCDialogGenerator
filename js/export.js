// 导出图片：单段 / 多段分割

// 将消息按 dialog-title 分割为多个段落
function splitMessagesByTitle(messages) {
    const sections = [];
    let current = { title: null, messages: [] };
    messages.forEach(msg => {
        if (msg.type === 'dialog-title') {
            if (current.messages.length > 0 || current.title) {
                sections.push(current);
            }
            current = { title: msg.content || '（无标题）', messages: [] };
        } else {
            current.messages.push(msg);
        }
    });
    if (current.messages.length > 0 || current.title) {
        sections.push(current);
    }
    if (sections.length === 0) {
        sections.push({ title: null, messages: messages });
    }
    return sections;
}

// 用于导出：渲染 sender title html
// position: 'right'（默认）| 'left'（self 使用，title 在 name 左侧）
function renderTitleHtmlForExport(sender, position) {
    if (!titlesEnabled) return '';
    const t = getTitleForSender(sender);
    if (!t) return '';
    const r = parseInt(t.color.slice(1, 3), 16);
    const g = parseInt(t.color.slice(3, 5), 16);
    const b = parseInt(t.color.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const textColor = luminance > 0.6 ? '#000' : '#fff';
    const marginStyle = position === 'left'
        ? 'margin-right: 6px; margin-left: 0;'
        : 'margin-left: 6px;';
    return `<span style="display: inline-block; font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 8px; ${marginStyle} vertical-align: middle; color: ${textColor}; background-color: ${t.color};">${escapeHtml(t.text)}</span>`;
}

// 文件 HTML（用于导出）
async function renderFilesForExportAsync(files) {
    if (!files || files.length === 0) return '';
    let html = '';
    for (const file of files) {
        if (file.type && file.type.startsWith('image/')) {
            html += `<div style="margin-top: 8px;"><img src="${file.data}" style="max-width: 200px; max-height: 200px; border-radius: 4px;" crossorigin="anonymous"></div>`;
        } else {
            html += `<div style="margin-top: 8px; padding: 8px; background: rgba(0,0,0,0.2); border-radius: 8px;"><span>📄</span> ${file.name}</div>`;
        }
    }
    return html;
}

// 创建单条消息的导出 DOM
async function createExportMessageElement(msg) {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `display: flex; margin-bottom: 16px; align-items: flex-start;`;

    if (msg.type === 'dialog-title') {
        wrapper.style.cssText = 'display: flex; justify-content: center; align-items: center; gap: 12px; margin: 20px 0 12px 0;';
        const line = document.createElement('div');
        line.style.cssText = 'flex: 1; height: 1px; background: linear-gradient(90deg, transparent, #3a5a7a, transparent); max-width: 200px;';
        wrapper.appendChild(line);
        const bubble = document.createElement('div');
        bubble.style.cssText = 'background-color: rgba(45, 90, 123, 0.4); border: 1px solid #3a5a7a; color: #cce4f5; padding: 6px 18px; border-radius: 20px; font-size: 14px; font-weight: 700;';
        bubble.textContent = msg.content || '（无标题）';
        wrapper.appendChild(bubble);
        wrapper.appendChild(line.cloneNode());
        return wrapper;
    }

    if (msg.sender.type === 'narrator') {
        wrapper.style.justifyContent = 'center';
        const content = document.createElement('div');
        content.style.cssText = 'font-style: italic; color: #888; font-size: 14px; text-align: center; max-width: 80%; white-space: pre-wrap;';
        content.innerHTML = msg.content || '';
        wrapper.appendChild(content);
        return wrapper;
    } else if (msg.sender.type === 'self') {
        wrapper.style.justifyContent = 'flex-end';
        let selfAvatar = selfConfig.avatar;
        if (selfAvatar && !selfAvatar.startsWith('data:')) {
            selfAvatar = await imageToDataURL(selfAvatar) || selfAvatar;
        }
        const avatar = selfAvatar || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'48\' viewBox=\'0 0 48 48\'%3E%3Ccircle cx=\'24\' cy=\'24\' r=\'24\' fill=\'%23666\'/%3E%3C/svg%3E';
        const avatarImg = document.createElement('img');
        avatarImg.src = avatar;
        avatarImg.style.cssText = 'width: 48px; height: 48px; border-radius: 50%; margin-right: 12px; object-fit: cover; align-self: flex-start; flex-shrink: 0;';

        const contentWrapper = document.createElement('div');
        contentWrapper.style.cssText = 'display: flex; flex-direction: column; align-items: flex-end; max-width: 60%;';
        const titleHtml = renderTitleHtmlForExport(msg.sender, 'left');
        if (msg.sender.name !== '我' || titleHtml) {
            const nameEl = document.createElement('div');
            nameEl.style.cssText = 'font-size: 12px; color: #aaa; margin-bottom: 4px;';
            nameEl.innerHTML = titleHtml + escapeHtml(msg.sender.name);
            contentWrapper.appendChild(nameEl);
        }
        const bubble = document.createElement('div');
        bubble.style.cssText = 'background-color: #007ACC; padding: 10px 14px; border-radius: 12px; border-bottom-right-radius: 4px; color: #fff; line-height: 1.5; word-break: break-word; white-space: pre-wrap;';
        bubble.innerHTML = (msg.content || '') + await renderFilesForExportAsync(msg.files);
        contentWrapper.appendChild(bubble);

        const time = document.createElement('div');
        time.style.cssText = 'font-size: 10px; color: #888; margin-top: 4px;';
        time.textContent = formatTime(msg.timestamp);
        contentWrapper.appendChild(time);

        wrapper.appendChild(contentWrapper);
        wrapper.appendChild(avatarImg);
        return wrapper;
    } else {
        const defaultAvatar = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'48\' viewBox=\'0 0 48 48\'%3E%3Ccircle cx=\'24\' cy=\'24\' r=\'24\' fill=\'%23666\'/%3E%3C/svg%3E';
        let avatarSrc = msg.sender.avatar;
        if (!avatarSrc) {
            if (msg.sender.type === 'preset') {
                const origName = msg.sender.originalName || msg.sender.name;
                const role = presetRoles.find(r => (r.originalName || r.name) === origName);
                if (role && role.avatar) {
                    avatarSrc = role.avatar;
                } else {
                    for (const [folder, files] of Object.entries(PRESET_ROLES_FALLBACK)) {
                        for (const file of files) {
                            const fileName = file.replace(/\.[^/.]+$/, '');
                            if (fileName === origName) {
                                avatarSrc = await imageToDataURL('Character/' + folder + '/' + file) || avatarSrc;
                                break;
                            }
                        }
                        if (avatarSrc && avatarSrc.startsWith('data:')) break;
                    }
                }
            } else if (msg.sender.type === 'custom') {
                const role = customRoles.find(r => r.id === msg.sender.id);
                if (role && role.avatar) avatarSrc = role.avatar;
            }
        }
        if (!avatarSrc) avatarSrc = defaultAvatar;
        if (avatarSrc && !avatarSrc.startsWith('data:') && !avatarSrc.startsWith('http')) {
            const converted = await imageToDataURL(avatarSrc);
            avatarSrc = (converted && converted.startsWith('data:')) ? converted : defaultAvatar;
        }
        const avatarImg = document.createElement('img');
        avatarImg.src = avatarSrc;
        avatarImg.style.cssText = 'width: 48px; height: 48px; border-radius: 50%; margin-left: 12px; object-fit: cover; align-self: flex-start; flex-shrink: 0;';

        const contentWrapper = document.createElement('div');
        contentWrapper.style.cssText = 'display: flex; flex-direction: column; align-items: flex-start; max-width: 60%;';

        const nameEl = document.createElement('div');
        nameEl.style.cssText = 'font-size: 12px; color: #aaa; margin-bottom: 4px;';
        nameEl.innerHTML = escapeHtml(msg.sender.name) + renderTitleHtmlForExport(msg.sender);
        contentWrapper.appendChild(nameEl);

        const bubbleColor = msg.sender.type === 'preset' || msg.sender.type === 'custom' ? '#2D5A7B' : '#1E3A4D';
        const bubble = document.createElement('div');
        bubble.style.cssText = `background-color: ${bubbleColor}; padding: 10px 14px; border-radius: 12px; border-bottom-left-radius: 4px; color: #fff; line-height: 1.5; word-break: break-word; white-space: pre-wrap;`;
        bubble.innerHTML = (msg.content || '') + await renderFilesForExportAsync(msg.files);
        contentWrapper.appendChild(bubble);

        const time = document.createElement('div');
        time.style.cssText = 'font-size: 10px; color: #888; margin-top: 4px;';
        time.textContent = formatTime(msg.timestamp);
        contentWrapper.appendChild(time);

        wrapper.appendChild(avatarImg);
        wrapper.appendChild(contentWrapper);
        return wrapper;
    }
}

// 创建导出图片的完整 DOM 容器
async function createExportContainer(messages, bigTitle, smallTitle, hasSmallTitle) {
    const is9_16 = exportAspectRatio === '9:16';
    const baseWidth = is9_16 ? 450 : 800;
    const baseHeight = is9_16 ? 800 : 450;

    const exportDiv = document.createElement('div');
    exportDiv.style.cssText = `
        width: ${baseWidth}px;
        min-height: ${baseHeight}px;
        background-color: #04151E;
        padding: 20px;
        font-family: 'LiberationSans', 'Source Han Sans SC', sans-serif;
        box-sizing: border-box;
    `;

    if (bigTitle) {
        const bigTitleWrapper = document.createElement('div');
        bigTitleWrapper.style.cssText = 'display: flex; justify-content: center; align-items: center; gap: 12px; margin-bottom: 16px;';
        const lineLeft = document.createElement('div');
        lineLeft.style.cssText = 'flex: 1; height: 2px; background: linear-gradient(90deg, transparent, #4a7a9a, #cce4f5, #4a7a9a, transparent); max-width: 240px;';
        bigTitleWrapper.appendChild(lineLeft);
        const bubble = document.createElement('div');
        bubble.style.cssText = 'background: linear-gradient(135deg, rgba(45, 90, 123, 0.6), rgba(28, 60, 85, 0.6)); border: 1.5px solid #5a8aab; color: #fff; padding: 8px 28px; border-radius: 24px; font-size: 18px; font-weight: 700; box-shadow: 0 2px 6px rgba(0,0,0,0.4);';
        bubble.textContent = bigTitle;
        bigTitleWrapper.appendChild(bubble);
        bigTitleWrapper.appendChild(lineLeft.cloneNode());
        exportDiv.appendChild(bigTitleWrapper);
    }

    if (hasSmallTitle && smallTitle) {
        const smallTitleWrapper = document.createElement('div');
        smallTitleWrapper.style.cssText = 'display: flex; justify-content: center; align-items: center; gap: 12px; margin-bottom: 20px;';
        const lineLeft2 = document.createElement('div');
        lineLeft2.style.cssText = 'flex: 1; height: 1px; background: linear-gradient(90deg, transparent, #3a5a7a, transparent); max-width: 200px;';
        smallTitleWrapper.appendChild(lineLeft2);
        const bubble2 = document.createElement('div');
        bubble2.style.cssText = 'background-color: rgba(45, 90, 123, 0.4); border: 1px solid #3a5a7a; color: #cce4f5; padding: 6px 18px; border-radius: 20px; font-size: 14px; font-weight: 700;';
        bubble2.textContent = smallTitle;
        smallTitleWrapper.appendChild(bubble2);
        smallTitleWrapper.appendChild(lineLeft2.cloneNode());
        exportDiv.appendChild(smallTitleWrapper);
    }

    const messagesContainer = document.createElement('div');
    messagesContainer.style.cssText = 'display: flex; flex-direction: column;';
    for (const msg of messages) {
        const el = await createExportMessageElement(msg);
        messagesContainer.appendChild(el);
    }
    exportDiv.appendChild(messagesContainer);

    const footer = document.createElement('div');
    footer.style.cssText = 'text-align: center; font-size: 12px; color: #fff; padding-top: 8px; padding-bottom: 16px; border-top: 1px solid #1a2a3a;';
    const now = new Date();
    footer.innerHTML = `
        <div style="margin-bottom: 4px; font-weight: bold; font-size: 16px;">IWBTC Dialog Generator <span style="font-size: 11px; color: #888; font-weight: normal;">版本 ${APP_VERSION}</span></div>
        <div style="margin-bottom: 4px;">由 殷离Shadon 制作，使用 Trae AI 生成，使用 MiniMax-M3 模型</div>
        <div style="margin-bottom: 4px;"><a href="https://yinlishadon.github.io/IWBTCDialogGenerator/" target="_blank" style="color: #007ACC; text-decoration: none;">https://yinlishadon.github.io/IWBTCDialogGenerator/</a></div>
        <div style="color: #888;">导出时间：${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}</div>
    `;
    exportDiv.appendChild(footer);

    return exportDiv;
}

function setExportPreviewRatio(ratio) {
    exportAspectRatio = ratio;
    document.querySelectorAll('.export-preview-header .aspect-ratio-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.ratio === ratio);
    });
    generateExportPreview();
}

function onExportOptionChange() {
    generateExportPreview();
}

async function generateExportPreview() {
    if (!currentConversationId) return;
    const conv = conversations.find(c => c.id === currentConversationId);
    if (!conv || !conv.messages || conv.messages.length === 0) return;

    pendingCanvases = [];
    const splitByTitle = document.getElementById('exportSplitByTitle') && document.getElementById('exportSplitByTitle').checked;

    let sections;
    if (splitByTitle) {
        const all = splitMessagesByTitle(conv.messages);
        sections = all.filter(s => s.messages.length > 0 || s.title);
        if (sections.length === 0) sections = [{ title: null, messages: conv.messages }];
    } else {
        sections = [{ title: null, messages: conv.messages }];
    }

    const previewContainer = document.getElementById('exportPreviewContent');
    previewContainer.innerHTML = '';

    try {
        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            const bigTitle = conv.name;
            const smallTitle = section.title || '（无标题）';
            const hasSmallTitle = splitByTitle && !!section.title;
            const exportDiv = await createExportContainer(section.messages, bigTitle, smallTitle, hasSmallTitle);
            document.body.appendChild(exportDiv);
            const canvas = await html2canvas(exportDiv, {
                backgroundColor: '#04151E',
                scale: 2,
                useCORS: true,
                allowTaint: true,
                imageTimeout: 15000
            });
            document.body.removeChild(exportDiv);

            const item = { canvas: canvas, title: section.title || conv.name };
            pendingCanvases.push(item);

            const img = document.createElement('img');
            img.src = canvas.toDataURL('image/png');
            img.style.cssText = 'max-width: 100%; display: block; margin-bottom: 12px; border: 1px solid #1a2a3a; border-radius: 4px;';
            previewContainer.appendChild(img);
        }
        pendingCanvas = pendingCanvases.length > 0 ? pendingCanvases[0].canvas : null;
    } catch (err) {
        console.error(err);
        showToast('生成预览失败', 'error');
    }
}

function confirmExportImage() {
    if (pendingCanvases && pendingCanvases.length > 0 && currentConversationId) {
        const conv = conversations.find(c => c.id === currentConversationId);
        const now = new Date();
        const exportTime = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
        let downloadedCount = 0;
        pendingCanvases.forEach((item, index) => {
            const link = document.createElement('a');
            const safeTitle = (item.title || `分段${index + 1}`).replace(/[\/\\:*?"<>|]/g, '_');
            if (pendingCanvases.length > 1) {
                link.download = `${conv.name}_${safeTitle}_${exportTime}.png`;
            } else {
                link.download = `${conv.name}_${exportTime}.png`;
            }
            link.href = item.canvas.toDataURL('image/png');
            setTimeout(() => link.click(), index * 200);
            downloadedCount++;
        });
        showToast(`已导出 ${downloadedCount} 张图片`, 'success');
        closeExportPreview();
    } else {
        showToast('图片正在生成中，请稍候', 'info');
    }
}

function closeExportPreview() {
    document.getElementById('exportPreviewModal').classList.remove('active');
    pendingCanvas = null;
    pendingCanvases = [];
}

async function showExportPreview() {
    if (!currentConversationId) {
        showToast('请先选择一个对话', 'error');
        return;
    }
    const conv = conversations.find(c => c.id === currentConversationId);
    if (!conv || !conv.messages || conv.messages.length === 0) {
        showToast('没有可导出的聊天记录', 'error');
        return;
    }
    document.querySelectorAll('.export-preview-header .aspect-ratio-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.ratio === exportAspectRatio);
    });
    document.getElementById('exportPreviewModal').classList.add('active');
    pendingCanvas = null;
    await generateExportPreview();
}
