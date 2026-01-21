/**
 * Admin Common JavaScript Functions
 * Handles toast notifications, modal management, and common utilities
 */

// Toast Notification Function
function showToast(message, type = 'success') {
    // Remove any existing toasts
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast-notification';

    // Icon based on type
    let icon = 'check-circle';
    let iconColor = 'success';
    let title = 'Berhasil!';

    if (type === 'error' || type === 'danger') {
        icon = 'exclamation-circle';
        iconColor = 'danger';
        title = 'Error!';
    } else if (type === 'warning') {
        icon = 'exclamation-triangle';
        iconColor = 'warning';
        title = 'Peringatan!';
    } else if (type === 'info') {
        icon = 'info-circle';
        iconColor = 'info';
        title = 'Informasi';
    }

    toast.innerHTML = `
        <div class="d-flex align-items-start">
            <i class="fas fa-${icon} text-${iconColor} fa-2x me-3"></i>
            <div class="flex-grow-1">
                <strong class="d-block mb-1">${title}</strong>
                <p class="mb-0">${message}</p>
            </div>
            <button type="button" class="btn-close ms-3" onclick="this.parentElement.parentElement.remove()"></button>
        </div>
    `;

    document.body.appendChild(toast);

    // Auto remove after 4 seconds
    setTimeout(() => {
        if (toast && toast.parentElement) {
            toast.style.animation = 'slideOutRight 0.4s ease-out';
            setTimeout(() => {
                if (toast && toast.parentElement) {
                    toast.remove();
                }
            }, 400);
        }
    }, 4000);
}

// Close modal by ID
function closeModal(modalId) {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) {
            modalInstance.hide();
        }
    }
}

// Show loading state on button
function setButtonLoading(buttonId, loading = true) {
    const button = document.getElementById(buttonId);
    if (!button) return;

    if (loading) {
        button.disabled = true;
        button.dataset.originalHtml = button.innerHTML;
        button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';
    } else {
        button.disabled = false;
        if (button.dataset.originalHtml) {
            button.innerHTML = button.dataset.originalHtml;
        }
    }
}

// Custom Confirm Dialog - Beautiful Modal
function confirmAction(options) {
    // Default options
    const defaults = {
        title: 'Konfirmasi',
        message: 'Apakah Anda yakin?',
        confirmText: 'Ya, Lanjutkan',
        cancelText: 'Batal',
        type: 'warning', // warning, danger, info, success
        onConfirm: () => {},
        onCancel: () => {}
    };

    const config = { ...defaults, ...options };

    // Remove existing confirm modal
    const existingModal = document.getElementById('customConfirmModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Icon and color based on type
    let icon = 'exclamation-triangle';
    let iconColor = '#f59e0b';
    let confirmBtnClass = 'btn-warning';

    if (config.type === 'danger') {
        icon = 'trash-alt';
        iconColor = '#dc2626';
        confirmBtnClass = 'btn-danger';
    } else if (config.type === 'info') {
        icon = 'info-circle';
        iconColor = '#3b82f6';
        confirmBtnClass = 'btn-info';
    } else if (config.type === 'success') {
        icon = 'check-circle';
        iconColor = '#16a34a';
        confirmBtnClass = 'btn-success';
    }

    // Create modal HTML
    const modalHTML = `
        <div class="modal fade" id="customConfirmModal" tabindex="-1" data-bs-backdrop="static">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content" style="border: none; border-radius: 16px; overflow: hidden;">
                    <div class="modal-body text-center p-5">
                        <div class="mb-4">
                            <div style="width: 80px; height: 80px; border-radius: 50%; background: ${iconColor}15; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-${icon}" style="font-size: 40px; color: ${iconColor};"></i>
                            </div>
                        </div>
                        <h4 class="mb-3 fw-bold">${config.title}</h4>
                        <p class="text-muted mb-4" style="font-size: 1rem;">${config.message}</p>
                        <div class="d-flex gap-3 justify-content-center">
                            <button type="button" class="btn btn-light px-4 py-2" id="confirmCancelBtn" style="min-width: 120px;">
                                <i class="fas fa-times me-2"></i>${config.cancelText}
                            </button>
                            <button type="button" class="btn ${confirmBtnClass} px-4 py-2" id="confirmOkBtn" style="min-width: 120px;">
                                <i class="fas fa-check me-2"></i>${config.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Get modal element
    const modalElement = document.getElementById('customConfirmModal');
    const modal = new bootstrap.Modal(modalElement);

    // Handle confirm
    document.getElementById('confirmOkBtn').addEventListener('click', function() {
        modal.hide();
        setTimeout(() => {
            modalElement.remove();
            config.onConfirm();
        }, 300);
    });

    // Handle cancel
    document.getElementById('confirmCancelBtn').addEventListener('click', function() {
        modal.hide();
        setTimeout(() => {
            modalElement.remove();
            config.onCancel();
        }, 300);
    });

    // Show modal
    modal.show();

    // Remove modal from DOM after hidden
    modalElement.addEventListener('hidden.bs.modal', function() {
        setTimeout(() => {
            if (document.getElementById('customConfirmModal')) {
                modalElement.remove();
            }
        }, 300);
    });
}

// Format date to Indonesian
function formatDateID(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
}

// Format datetime to Indonesian
function formatDateTimeID(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('id-ID', options);
}

// Add animation styles if not exist
(function() {
    if (!document.getElementById('admin-common-styles')) {
        const adminCommonStyle = document.createElement('style');
        adminCommonStyle.id = 'admin-common-styles';
        adminCommonStyle.textContent = `
        .toast-notification {
            position: fixed;
            top: 90px;
            right: 30px;
            min-width: 350px;
            max-width: 500px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            padding: 20px;
            z-index: 99999;
            animation: slideInRight 0.4s ease-out;
            border-left: 4px solid #16a34a;
        }

        .toast-notification .text-success {
            color: #16a34a !important;
        }

        .toast-notification .text-danger {
            color: #dc2626 !important;
        }

        .toast-notification .text-warning {
            color: #f59e0b !important;
        }

        .toast-notification .text-info {
            color: #3b82f6 !important;
        }

        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(100px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        @keyframes slideOutRight {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(100px);
            }
        }

        .spinner-border-sm {
            width: 1rem;
            height: 1rem;
            border-width: 0.15em;
        }

        /* Fix all button styling - make them visible and clear */

        /* Primary Button (Tambah/Add) - Green */
        .btn-primary {
            background: #16a34a !important;
            border-color: #16a34a !important;
            color: white !important;
            font-weight: 500 !important;
        }

        .btn-primary:hover {
            background: #15803d !important;
            border-color: #15803d !important;
            color: white !important;
        }

        .btn-primary:focus,
        .btn-primary:active {
            background: #15803d !important;
            border-color: #15803d !important;
            color: white !important;
            box-shadow: 0 0 0 0.2rem rgba(22, 163, 74, 0.25) !important;
        }

        /* Warning Button (Edit) - Orange */
        .btn-warning {
            background: #f59e0b !important;
            border-color: #f59e0b !important;
            color: white !important;
            font-weight: 500 !important;
        }

        .btn-warning:hover {
            background: #d97706 !important;
            border-color: #d97706 !important;
            color: white !important;
        }

        .btn-warning:focus,
        .btn-warning:active {
            background: #d97706 !important;
            border-color: #d97706 !important;
            color: white !important;
            box-shadow: 0 0 0 0.2rem rgba(245, 158, 11, 0.25) !important;
        }

        /* Danger Button (Delete) - Red */
        .btn-danger {
            background: #dc2626 !important;
            border-color: #dc2626 !important;
            color: white !important;
            font-weight: 500 !important;
        }

        .btn-danger:hover {
            background: #b91c1c !important;
            border-color: #b91c1c !important;
            color: white !important;
        }

        .btn-danger:focus,
        .btn-danger:active {
            background: #b91c1c !important;
            border-color: #b91c1c !important;
            color: white !important;
            box-shadow: 0 0 0 0.2rem rgba(220, 38, 38, 0.25) !important;
        }

        /* Info Button (View/Detail) - Blue */
        .btn-info {
            background: #3b82f6 !important;
            border-color: #3b82f6 !important;
            color: white !important;
            font-weight: 500 !important;
        }

        .btn-info:hover {
            background: #2563eb !important;
            border-color: #2563eb !important;
            color: white !important;
        }

        .btn-info:focus,
        .btn-info:active {
            background: #2563eb !important;
            border-color: #2563eb !important;
            color: white !important;
            box-shadow: 0 0 0 0.2rem rgba(59, 130, 246, 0.25) !important;
        }

        /* Success Button - Green */
        .btn-success {
            background: #16a34a !important;
            border-color: #16a34a !important;
            color: white !important;
            font-weight: 500 !important;
        }

        .btn-success:hover {
            background: #15803d !important;
            border-color: #15803d !important;
            color: white !important;
        }

        .btn-success:focus,
        .btn-success:active {
            background: #15803d !important;
            border-color: #15803d !important;
            color: white !important;
            box-shadow: 0 0 0 0.2rem rgba(22, 163, 74, 0.25) !important;
        }

        /* Secondary Button - Gray */
        .btn-secondary {
            background: #6b7280 !important;
            border-color: #6b7280 !important;
            color: white !important;
            font-weight: 500 !important;
        }

        .btn-secondary:hover {
            background: #4b5563 !important;
            border-color: #4b5563 !important;
            color: white !important;
        }

        .btn-secondary:focus,
        .btn-secondary:active {
            background: #4b5563 !important;
            border-color: #4b5563 !important;
            color: white !important;
            box-shadow: 0 0 0 0.2rem rgba(107, 114, 128, 0.25) !important;
        }

        /* Light Button - Light Gray */
        .btn-light {
            background: #f3f4f6 !important;
            border-color: #e5e7eb !important;
            color: #374151 !important;
            font-weight: 500 !important;
        }

        .btn-light:hover {
            background: #e5e7eb !important;
            border-color: #d1d5db !important;
            color: #1f2937 !important;
        }

        .btn-light:focus,
        .btn-light:active {
            background: #e5e7eb !important;
            border-color: #d1d5db !important;
            color: #1f2937 !important;
            box-shadow: 0 0 0 0.2rem rgba(229, 231, 235, 0.5) !important;
        }

        /* Small buttons */
        .btn-sm {
            padding: 4px 8px !important;
            font-size: 0.875rem !important;
        }

        /* Button group spacing */
        .btn-group .btn {
            margin: 0 !important;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
        document.head.appendChild(adminCommonStyle);
    }
})();
