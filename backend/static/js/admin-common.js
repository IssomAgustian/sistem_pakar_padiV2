/**
 * Admin Common JavaScript Functions
 * Handles toast notifications, modal helpers, and small shared utilities.
 */

function showToast(message, type = 'success') {
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;

    let icon = 'check-circle';
    let iconColor = 'success';
    let title = 'Berhasil';

    if (type === 'error' || type === 'danger') {
        icon = 'exclamation-circle';
        iconColor = 'danger';
        title = 'Error';
    } else if (type === 'warning') {
        icon = 'exclamation-triangle';
        iconColor = 'warning';
        title = 'Peringatan';
    } else if (type === 'info') {
        icon = 'info-circle';
        iconColor = 'info';
        title = 'Informasi';
    }

    toast.innerHTML = `
        <div class="d-flex align-items-start gap-2">
            <i class="fas fa-${icon} text-${iconColor} mt-1"></i>
            <div class="flex-grow-1">
                <strong class="d-block">${title}</strong>
                <span>${message}</span>
            </div>
            <button type="button" class="btn-close" onclick="this.closest('.toast-notification').remove()"></button>
        </div>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        if (toast && toast.parentElement) {
            toast.classList.add('toast-leave');
            setTimeout(() => {
                if (toast && toast.parentElement) {
                    toast.remove();
                }
            }, 280);
        }
    }, 3500);
}

function closeModal(modalId) {
    const modalElement = document.getElementById(modalId);
    if (!modalElement) return;

    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) {
        modalInstance.hide();
    }
}

function setButtonLoading(buttonId, loading = true, loadingText = 'Menyimpan...') {
    const button = document.getElementById(buttonId);
    if (!button) return;

    if (loading) {
        button.disabled = true;
        button.dataset.originalHtml = button.innerHTML;
        button.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>${loadingText}`;
        return;
    }

    button.disabled = false;
    if (button.dataset.originalHtml) {
        button.innerHTML = button.dataset.originalHtml;
    }
}

function confirmAction(options) {
    const defaults = {
        title: 'Konfirmasi',
        message: 'Apakah Anda yakin?',
        confirmText: 'Ya, Lanjutkan',
        cancelText: 'Batal',
        type: 'warning',
        onConfirm: () => {},
        onCancel: () => {}
    };

    const config = { ...defaults, ...options };

    const existingModal = document.getElementById('customConfirmModal');
    if (existingModal) {
        existingModal.remove();
    }

    let icon = 'exclamation-triangle';
    let iconColor = '#d88b28';
    let confirmBtnClass = 'btn-warning';

    if (config.type === 'danger') {
        icon = 'trash-alt';
        iconColor = '#ba4545';
        confirmBtnClass = 'btn-danger';
    } else if (config.type === 'info') {
        icon = 'info-circle';
        iconColor = '#2f7abb';
        confirmBtnClass = 'btn-info';
    } else if (config.type === 'success') {
        icon = 'check-circle';
        iconColor = '#2c915f';
        confirmBtnClass = 'btn-success';
    }

    const modalHTML = `
        <div class="modal fade" id="customConfirmModal" tabindex="-1" data-bs-backdrop="static">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-body text-center p-4">
                        <div class="mb-3">
                            <div style="width: 72px; height: 72px; border-radius: 999px; background: ${iconColor}1f; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-${icon}" style="font-size: 30px; color: ${iconColor};"></i>
                            </div>
                        </div>
                        <h5 class="mb-2 fw-bold">${config.title}</h5>
                        <p class="text-muted mb-4">${config.message}</p>
                        <div class="d-flex gap-2 justify-content-center">
                            <button type="button" class="btn btn-light px-3" id="confirmCancelBtn">${config.cancelText}</button>
                            <button type="button" class="btn ${confirmBtnClass} px-3" id="confirmOkBtn">${config.confirmText}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modalElement = document.getElementById('customConfirmModal');
    const modal = new bootstrap.Modal(modalElement);

    document.getElementById('confirmOkBtn').addEventListener('click', () => {
        modal.hide();
        setTimeout(() => {
            modalElement.remove();
            config.onConfirm();
        }, 200);
    });

    document.getElementById('confirmCancelBtn').addEventListener('click', () => {
        modal.hide();
        setTimeout(() => {
            modalElement.remove();
            config.onCancel();
        }, 200);
    });

    modal.show();

    modalElement.addEventListener('hidden.bs.modal', () => {
        setTimeout(() => {
            if (document.getElementById('customConfirmModal')) {
                modalElement.remove();
            }
        }, 180);
    });
}

function formatDateID(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatDateTimeID(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

(function injectSharedStyles() {
    if (document.getElementById('admin-common-styles')) return;

    const style = document.createElement('style');
    style.id = 'admin-common-styles';
    style.textContent = `
        .toast-notification {
            animation: toastIn 0.25s ease;
        }

        .toast-notification.toast-leave {
            animation: toastOut 0.28s ease forwards;
        }

        .spinner-border-sm {
            width: 1rem;
            height: 1rem;
            border-width: .16em;
        }

        @keyframes toastIn {
            from { opacity: 0; transform: translateY(-8px) translateX(10px); }
            to { opacity: 1; transform: translateY(0) translateX(0); }
        }

        @keyframes toastOut {
            from { opacity: 1; transform: translateY(0) translateX(0); }
            to { opacity: 0; transform: translateY(-6px) translateX(12px); }
        }
    `;

    document.head.appendChild(style);
})();