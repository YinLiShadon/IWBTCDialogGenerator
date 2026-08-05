// Toast 提示 + 自定义确认对话框

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showConfirmDialog(title, message) {
    return new Promise((resolve) => {
        const titleEl = document.getElementById('confirmDialogTitle');
        const msgEl = document.getElementById('confirmDialogMessage');
        const overlay = document.getElementById('confirmDialogOverlay');
        if (titleEl) titleEl.textContent = title;
        if (msgEl) msgEl.textContent = message;
        if (overlay) overlay.style.display = 'flex';
        confirmDialogCallback = resolve;
    });
}

function closeConfirmDialog(result) {
    const overlay = document.getElementById('confirmDialogOverlay');
    if (overlay) overlay.style.display = 'none';
    if (confirmDialogCallback) {
        confirmDialogCallback(result);
        confirmDialogCallback = null;
    }
}
