// 通用模态框控制 + 图片预览 + 关于/使用指南/更新日志

function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
}

function showImagePreview(src) {
    const imgEl = document.getElementById('imagePreviewContent');
    if (imgEl) imgEl.src = src;
    openModal('imagePreviewModal');
}

function closeImagePreview() {
    closeModal('imagePreviewModal');
}

function showAboutModal() {
    openModal('aboutModal');
}

function showGuideModal() {
    openModal('guideModal');
}

function showChangelogModal() {
    openModal('changelogModal');
}

// 点击 modal 背景关闭
function initModalClickOutsideEvents() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
    });
}
