/**
 * Admin Panel JavaScript
 * Sistem Pakar Diagnosis Penyakit Tanaman Padi
 * Comprehensive AJAX calls and interactive features
 */

// ===================================
// 1. GLOBAL VARIABLES & CONFIG
// ===================================
const API_BASE_URL = window.location.origin;
const ADMIN_API_URL = `${API_BASE_URL}/admin`;

// Get JWT token from localStorage or cookie
function getAuthToken() {
    return localStorage.getItem('admin_token') || '';
}

// Set active nav link
function setActiveNav() {
    const currentPath = window.location.pathname;
    document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// ===================================
// 2. API HELPER FUNCTIONS
// ===================================
async function apiRequest(url, options = {}) {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        showToast(error.message, 'danger');
        throw error;
    }
}

// ===================================
// 3. UI HELPER FUNCTIONS
// ===================================
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} toast`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showLoading() {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.id = 'loading-overlay';
    overlay.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(overlay);
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.remove();
}

function confirmDelete(message = 'Apakah Anda yakin ingin menghapus data ini?') {
    return confirm(message);
}

// ===================================
// 4. MODAL FUNCTIONS
// ===================================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Close modal when clicking overlay
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
    }
});

// ===================================
// 5. DASHBOARD FUNCTIONS
// ===================================
async function loadDashboardStats() {
    try {
        const data = await apiRequest(`${ADMIN_API_URL}/dashboard/stats`);

        if (data.success) {
            updateStatCard('total-users', data.data.total_users);
            updateStatCard('total-diseases', data.data.total_diseases);
            updateStatCard('total-symptoms', data.data.total_symptoms);
            updateStatCard('total-diagnoses', data.data.total_diagnoses);
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

function updateStatCard(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

// ===================================
// 6. KELOLA PENYAKIT (DISEASES)
// ===================================
let currentDiseasePage = 1;
let diseaseSearch = '';

async function loadDiseases(page = 1, search = '') {
    try {
        showLoading();
        const data = await apiRequest(
            `${ADMIN_API_URL}/penyakit/list?page=${page}&search=${search}`
        );

        if (data.success) {
            renderDiseasesTable(data.data);
            renderPagination(data.pagination, 'disease-pagination', loadDiseases);
        }
    } catch (error) {
        console.error('Error loading diseases:', error);
    } finally {
        hideLoading();
    }
}

function renderDiseasesTable(diseases) {
    const tbody = document.getElementById('diseases-tbody');
    if (!tbody) return;

    if (diseases.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">Tidak ada data</td></tr>';
        return;
    }

    tbody.innerHTML = diseases.map((disease, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${disease.code}</td>
            <td>${disease.name}</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="viewDisease(${disease.id})">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-warning" onclick="editDisease(${disease.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteDisease(${disease.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function saveDisease(formData) {
    try {
        showLoading();
        const data = await apiRequest(`${ADMIN_API_URL}/penyakit/create`, {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        if (data.success) {
            showToast('Penyakit berhasil ditambahkan', 'success');
            closeModal('disease-modal');
            loadDiseases(currentDiseasePage, diseaseSearch);
        }
    } catch (error) {
        console.error('Error saving disease:', error);
    } finally {
        hideLoading();
    }
}

async function updateDisease(id, formData) {
    try {
        showLoading();
        const data = await apiRequest(`${ADMIN_API_URL}/penyakit/${id}`, {
            method: 'PUT',
            body: JSON.stringify(formData)
        });

        if (data.success) {
            showToast('Penyakit berhasil diupdate', 'success');
            closeModal('disease-modal');
            loadDiseases(currentDiseasePage, diseaseSearch);
        }
    } catch (error) {
        console.error('Error updating disease:', error);
    } finally {
        hideLoading();
    }
}

async function deleteDisease(id) {
    if (!confirmDelete()) return;

    try {
        showLoading();
        const data = await apiRequest(`${ADMIN_API_URL}/penyakit/${id}`, {
            method: 'DELETE'
        });

        if (data.success) {
            showToast('Penyakit berhasil dihapus', 'success');
            loadDiseases(currentDiseasePage, diseaseSearch);
        }
    } catch (error) {
        console.error('Error deleting disease:', error);
    } finally {
        hideLoading();
    }
}

// ===================================
// 7. KELOLA GEJALA (SYMPTOMS)
// ===================================
let currentSymptomPage = 1;
let symptomSearch = '';
let symptomCategory = '';

async function loadSymptoms(page = 1, search = '', category = '') {
    try {
        showLoading();
        const data = await apiRequest(
            `${ADMIN_API_URL}/gejala/list?page=${page}&search=${search}&category=${category}`
        );

        if (data.success) {
            renderSymptomsTable(data.data);
            renderPagination(data.pagination, 'symptom-pagination', loadSymptoms);
        }
    } catch (error) {
        console.error('Error loading symptoms:', error);
    } finally {
        hideLoading();
    }
}

function renderSymptomsTable(symptoms) {
    const tbody = document.getElementById('symptoms-tbody');
    if (!tbody) return;

    if (symptoms.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Tidak ada data</td></tr>';
        return;
    }

    tbody.innerHTML = symptoms.map((symptom, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${symptom.code}</td>
            <td>${symptom.name}</td>
            <td><span class="badge badge-info">${symptom.category}</span></td>
            <td>${symptom.mb_value} / ${symptom.md_value}</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editSymptom(${symptom.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteSymptom(${symptom.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function saveSymptom(formData) {
    try {
        showLoading();
        const data = await apiRequest(`${ADMIN_API_URL}/gejala/create`, {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        if (data.success) {
            showToast('Gejala berhasil ditambahkan', 'success');
            closeModal('symptom-modal');
            loadSymptoms(currentSymptomPage, symptomSearch, symptomCategory);
        }
    } catch (error) {
        console.error('Error saving symptom:', error);
    } finally {
        hideLoading();
    }
}

async function deleteSymptom(id) {
    if (!confirmDelete()) return;

    try {
        showLoading();
        const data = await apiRequest(`${ADMIN_API_URL}/gejala/${id}`, {
            method: 'DELETE'
        });

        if (data.success) {
            showToast('Gejala berhasil dihapus', 'success');
            loadSymptoms(currentSymptomPage, symptomSearch, symptomCategory);
        }
    } catch (error) {
        console.error('Error deleting symptom:', error);
    } finally {
        hideLoading();
    }
}

// ===================================
// 8. KELOLA RULE BASE
// ===================================
let currentRulePage = 1;

async function loadRules(page = 1) {
    try {
        showLoading();
        const data = await apiRequest(
            `${ADMIN_API_URL}/rules/list?page=${page}`
        );

        if (data.success) {
            renderRulesTable(data.data);
            renderPagination(data.pagination, 'rule-pagination', loadRules);
        }
    } catch (error) {
        console.error('Error loading rules:', error);
    } finally {
        hideLoading();
    }
}

function renderRulesTable(rules) {
    const tbody = document.getElementById('rules-tbody');
    if (!tbody) return;

    if (rules.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Tidak ada data</td></tr>';
        return;
    }

    tbody.innerHTML = rules.map((rule, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${rule.rule_code}</td>
            <td>${rule.disease_name}</td>
            <td>${rule.symptom_ids.length} gejala</td>
            <td>${rule.confidence_level}</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editRule(${rule.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteRule(${rule.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function saveRule(formData) {
    try {
        showLoading();
        const data = await apiRequest(`${ADMIN_API_URL}/rules/create`, {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        if (data.success) {
            showToast('Rule berhasil ditambahkan', 'success');
            closeModal('rule-modal');
            loadRules(currentRulePage);
        }
    } catch (error) {
        console.error('Error saving rule:', error);
    } finally {
        hideLoading();
    }
}

async function deleteRule(id) {
    if (!confirmDelete()) return;

    try {
        showLoading();
        const data = await apiRequest(`${ADMIN_API_URL}/rules/${id}`, {
            method: 'DELETE'
        });

        if (data.success) {
            showToast('Rule berhasil dihapus', 'success');
            loadRules(currentRulePage);
        }
    } catch (error) {
        console.error('Error deleting rule:', error);
    } finally {
        hideLoading();
    }
}

// ===================================
// 9. DATA PENGGUNA (USERS)
// ===================================
let currentUserPage = 1;

async function loadUsers(page = 1) {
    try {
        showLoading();
        const data = await apiRequest(
            `${ADMIN_API_URL}/pengguna/list?page=${page}`
        );

        if (data.success) {
            renderUsersTable(data.data);
            renderPagination(data.pagination, 'user-pagination', loadUsers);
        }
    } catch (error) {
        console.error('Error loading users:', error);
    } finally {
        hideLoading();
    }
}

function renderUsersTable(users) {
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Tidak ada data</td></tr>';
        return;
    }

    tbody.innerHTML = users.map((user, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${user.full_name || '-'}</td>
            <td>${user.email}</td>
            <td><span class="badge badge-${user.role === 'admin' ? 'warning' : 'info'}">${user.role}</span></td>
            <td><span class="badge badge-${user.is_active ? 'success' : 'danger'}">${user.is_active ? 'Active' : 'Inactive'}</span></td>
            <td>
                <button class="btn btn-sm btn-${user.is_active ? 'warning' : 'success'}"
                        onclick="toggleUserStatus(${user.id}, ${!user.is_active})">
                    <i class="fas fa-${user.is_active ? 'ban' : 'check'}"></i>
                    ${user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
            </td>
        </tr>
    `).join('');
}

async function toggleUserStatus(userId, newStatus) {
    try {
        showLoading();
        const data = await apiRequest(`${ADMIN_API_URL}/pengguna/${userId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ is_active: newStatus })
        });

        if (data.success) {
            showToast(`User berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`, 'success');
            loadUsers(currentUserPage);
        }
    } catch (error) {
        console.error('Error toggling user status:', error);
    } finally {
        hideLoading();
    }
}

// ===================================
// 10. RIWAYAT DIAGNOSIS (HISTORY)
// ===================================
let currentHistoryPage = 1;

async function loadDiagnosisHistory(page = 1) {
    try {
        showLoading();
        const data = await apiRequest(
            `${ADMIN_API_URL}/riwayat/list?page=${page}`
        );

        if (data.success) {
            renderHistoryTable(data.data);
            renderPagination(data.pagination, 'history-pagination', loadDiagnosisHistory);
        }
    } catch (error) {
        console.error('Error loading history:', error);
    } finally {
        hideLoading();
    }
}

function renderHistoryTable(history) {
    const tbody = document.getElementById('history-tbody');
    if (!tbody) return;

    if (history.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Tidak ada data</td></tr>';
        return;
    }

    tbody.innerHTML = history.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${item.user_email || 'Anonymous'}</td>
            <td>${item.disease_name}</td>
            <td>${(item.final_cf_value * 100).toFixed(2)}%</td>
            <td>${new Date(item.diagnosis_date).toLocaleDateString('id-ID')}</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="viewDiagnosisDetail(${item.id})">
                    <i class="fas fa-eye"></i> Detail
                </button>
            </td>
        </tr>
    `).join('');
}

// ===================================
// 11. LAPORAN & ANALISIS
// ===================================
async function loadReportData() {
    try {
        showLoading();
        const data = await apiRequest(`${ADMIN_API_URL}/laporan/statistics`);

        if (data.success) {
            renderCharts(data.data);
        }
    } catch (error) {
        console.error('Error loading report data:', error);
    } finally {
        hideLoading();
    }
}

function renderCharts(data) {
    // Implement chart rendering using Chart.js
    // This would be specific to the charts library used
    console.log('Chart data:', data);
}

async function exportReport(format = 'pdf') {
    try {
        showLoading();
        const response = await fetch(`${ADMIN_API_URL}/laporan/export?format=${format}`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `laporan_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        showToast('Laporan berhasil diexport', 'success');
    } catch (error) {
        console.error('Error exporting report:', error);
    } finally {
        hideLoading();
    }
}

// ===================================
// 12. PENGATURAN SISTEM
// ===================================
async function loadSystemSettings() {
    try {
        const data = await apiRequest(`${ADMIN_API_URL}/pengaturan-sistem/list`);

        if (data.success) {
            populateSettingsForm(data.data);
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

function populateSettingsForm(settings) {
    settings.forEach(setting => {
        const input = document.getElementById(`setting_${setting.setting_key}`);
        if (input) {
            input.value = setting.setting_value;
        }
    });
}

async function saveSystemSettings(formData) {
    try {
        showLoading();
        const data = await apiRequest(`${ADMIN_API_URL}/pengaturan-sistem/update`, {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        if (data.success) {
            showToast('Pengaturan berhasil disimpan', 'success');
        }
    } catch (error) {
        console.error('Error saving settings:', error);
    } finally {
        hideLoading();
    }
}

// ===================================
// 13. LOGS & AKTIVITAS
// ===================================
let currentLogPage = 1;

async function loadAdminLogs(page = 1) {
    try {
        showLoading();
        const data = await apiRequest(
            `${ADMIN_API_URL}/logs/list?page=${page}`
        );

        if (data.success) {
            renderLogsTable(data.data);
            renderPagination(data.pagination, 'log-pagination', loadAdminLogs);
        }
    } catch (error) {
        console.error('Error loading logs:', error);
    } finally {
        hideLoading();
    }
}

function renderLogsTable(logs) {
    const tbody = document.getElementById('logs-tbody');
    if (!tbody) return;

    if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Tidak ada data</td></tr>';
        return;
    }

    tbody.innerHTML = logs.map((log, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${log.admin_name}</td>
            <td><span class="badge badge-info">${log.action}</span></td>
            <td>${log.table_name}</td>
            <td>${new Date(log.created_at).toLocaleString('id-ID')}</td>
        </tr>
    `).join('');
}

// ===================================
// 14. PAGINATION RENDERER
// ===================================
function renderPagination(pagination, containerId, loadFunction) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const { page, pages } = pagination;

    let html = `
        <button class="pagination-btn" ${page === 1 ? 'disabled' : ''}
                onclick="${loadFunction.name}(${page - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;

    for (let i = 1; i <= pages; i++) {
        if (i === 1 || i === pages || (i >= page - 2 && i <= page + 2)) {
            html += `
                <button class="pagination-btn ${i === page ? 'active' : ''}"
                        onclick="${loadFunction.name}(${i})">
                    ${i}
                </button>
            `;
        } else if (i === page - 3 || i === page + 3) {
            html += '<span>...</span>';
        }
    }

    html += `
        <button class="pagination-btn" ${page === pages ? 'disabled' : ''}
                onclick="${loadFunction.name}(${page + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

    container.innerHTML = html;
}

// ===================================
// 15. FORM HANDLERS
// ===================================
function handleFormSubmit(formId, submitHandler) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        await submitHandler(data);
    });
}

// ===================================
// 16. SEARCH HANDLERS
// ===================================
function setupSearch(inputId, loadFunction) {
    const input = document.getElementById(inputId);
    if (!input) return;

    let timeout;
    input.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            loadFunction(1, e.target.value);
        }, 500);
    });
}

// ===================================
// 17. INITIALIZATION
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    // Set active navigation
    setActiveNav();

    // Setup mobile menu toggle
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar');

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
        });
    }

    // Close modals on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.active').forEach(modal => {
                modal.classList.remove('active');
            });
        }
    });

    // Initialize page-specific functions
    const currentPage = window.location.pathname.split('/').pop();

    switch(currentPage) {
        case 'dashboard':
            loadDashboardStats();
            break;
        case 'diseases':
            loadDiseases();
            setupSearch('disease-search', (page, search) => {
                diseaseSearch = search;
                loadDiseases(page, search);
            });
            break;
        case 'symptoms':
            loadSymptoms();
            setupSearch('symptom-search', (page, search) => {
                symptomSearch = search;
                loadSymptoms(page, search, symptomCategory);
            });
            break;
        case 'rules':
            loadRules();
            break;
        case 'users':
            loadUsers();
            break;
        case 'history':
            loadDiagnosisHistory();
            break;
        case 'reports':
            loadReportData();
            break;
        case 'settings':
            loadSystemSettings();
            break;
        case 'logs':
            loadAdminLogs();
            break;
    }
});

// Export functions for use in HTML
window.adminJS = {
    loadDiseases,
    saveDisease,
    updateDisease,
    deleteDisease,
    loadSymptoms,
    saveSymptom,
    deleteSymptom,
    loadRules,
    saveRule,
    deleteRule,
    loadUsers,
    toggleUserStatus,
    loadDiagnosisHistory,
    exportReport,
    saveSystemSettings,
    openModal,
    closeModal,
    showToast
};
