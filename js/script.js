// Global variables
let currentUser = null;
let chartInstances = {};
let currentData = [];
let currentPage = 1;
const itemsPerPage = 20;

// Utility Functions
function showLoading() {
    document.getElementById('loading').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function showMessage(message, type = 'success') {
    const container = document.getElementById('messageContainer') || createMessageContainer();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = message;
    
    container.appendChild(messageDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 5000);
}

function createMessageContainer() {
    const container = document.createElement('div');
    container.id = 'messageContainer';
    container.className = 'message-container';
    document.body.appendChild(container);
    return container;
}

function destroyChart(chartId) {
    if (chartInstances[chartId]) {
        chartInstances[chartId].destroy();
        delete chartInstances[chartId];
    }
}

function createChart(canvasId, config) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error('Canvas not found:', canvasId);
        return null;
    }
    
    destroyChart(canvasId);
    
    const ctx = canvas.getContext('2d');
    chartInstances[canvasId] = new Chart(ctx, config);
    return chartInstances[canvasId];
}

// Dashboard Functions
async function initializeDashboard() {
    try {
        showLoading();
        
        // Load summary data
        await loadDashboardData();
        
        // Load available years
        await loadAvailableYears('yearSelect');
        
        // Setup event listeners
        setupDashboardEventListeners();
        
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        showMessage('Gagal memuat data dashboard: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function loadDashboardData(selectedYear = null) {
    try {
        const result = await SupabaseAPI.getSummaryData();
        
        if (!result.success) {
            throw new Error(result.error);
        }
        
        const { summary, yearlyData } = result.data;
        
        // Update summary cards
        updateSummaryCards(summary, selectedYear, result.data.rawData);
        
        // Create category comparison chart
        createCategoryChart(summary, selectedYear);
        
        // Create yearly trend chart
        createYearlyTrendChart(yearlyData, selectedYear);
        
    } catch (error) {
        console.error('Load dashboard data error:', error);
        showMessage('Gagal memuat data: ' + error.message, 'error');
    }
}

function updateSummaryCards(summary, selectedYear, rawData) {
    // Filter data by year if selected
    let filteredData = rawData;
    if (selectedYear) {
        filteredData = rawData.filter(item => item.tahun.toString() === selectedYear);
    }
    
    // Recalculate summary for filtered data
    const filteredSummary = {
        pendapatan: { total: 0, count: 0 },
        pembelanjaan: { total: 0, count: 0 },
        pembiayaan: { total: 0, count: 0 }
    };
    
    filteredData.forEach(item => {
        if (filteredSummary[item.kategori]) {
            filteredSummary[item.kategori].total += item.nilai;
            filteredSummary[item.kategori].count += 1;
        }
    });
    
    // Update DOM
    document.getElementById('totalPendapatan').textContent = SupabaseAPI.formatCurrency(filteredSummary.pendapatan.total);
    document.getElementById('countPendapatan').textContent = `${filteredSummary.pendapatan.count} item`;
    
    document.getElementById('totalPembelanjaan').textContent = SupabaseAPI.formatCurrency(filteredSummary.pembelanjaan.total);
    document.getElementById('countPembelanjaan').textContent = `${filteredSummary.pembelanjaan.count} item`;
    
    document.getElementById('totalPembiayaan').textContent = SupabaseAPI.formatCurrency(filteredSummary.pembiayaan.total);
    document.getElementById('countPembiayaan').textContent = `${filteredSummary.pembiayaan.count} item`;
}

function createCategoryChart(summary, selectedYear) {
    const data = selectedYear ? 
        // If year selected, recalculate from filtered data
        calculateFilteredSummary(selectedYear) :
        summary;
    
    const chartData = {
        labels: ['Pendapatan', 'Pembelanjaan', 'Pembiayaan'],
        datasets: [{
            data: [
                data.pendapatan.total,
                data.pembelanjaan.total,
                data.pembiayaan.total
            ],
            backgroundColor: [
                '#48bb78', // Green for income
                '#f56565', // Red for expenses
                '#4299e1'  // Blue for financing
            ],
            borderWidth: 2,
            borderColor: '#ffffff'
        }]
    };
    
    const config = {
        type: 'doughnut',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = SupabaseAPI.formatCurrency(context.parsed);
                            return `${label}: ${value}`;
                        }
                    }
                }
            }
        }
    };
    
    createChart('categoryChart', config);
}

function createYearlyTrendChart(yearlyData, selectedYear) {
    const years = Object.keys(yearlyData).sort();
    
    if (years.length === 0) {
        // No data available
        const canvas = document.getElementById('yearlyChart');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '16px Arial';
        ctx.fillStyle = '#718096';
        ctx.textAlign = 'center';
        ctx.fillText('Belum ada data untuk ditampilkan', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    const chartData = {
        labels: years,
        datasets: [
            {
                label: 'Pendapatan',
                data: years.map(year => yearlyData[year].pendapatan),
                borderColor: '#48bb78',
                backgroundColor: 'rgba(72, 187, 120, 0.1)',
                tension: 0.1
            },
            {
                label: 'Pembelanjaan',
                data: years.map(year => yearlyData[year].pembelanjaan),
                borderColor: '#f56565',
                backgroundColor: 'rgba(245, 101, 101, 0.1)',
                tension: 0.1
            },
            {
                label: 'Pembiayaan',
                data: years.map(year => yearlyData[year].pembiayaan),
                borderColor: '#4299e1',
                backgroundColor: 'rgba(66, 153, 225, 0.1)',
                tension: 0.1
            }
        ]
    };
    
    const config = {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = SupabaseAPI.formatCurrency(context.parsed.y);
                            return `${label}: ${value}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return SupabaseAPI.formatCurrency(value);
                        }
                    }
                }
            }
        }
    };
    
    createChart('yearlyChart', config);
}

async function calculateFilteredSummary(selectedYear) {
    const result = await SupabaseAPI.getAllData({ tahun: selectedYear });
    
    if (!result.success) return { pendapatan: { total: 0 }, pembelanjaan: { total: 0 }, pembiayaan: { total: 0 } };
    
    const summary = {
        pendapatan: { total: 0, count: 0 },
        pembelanjaan: { total: 0, count: 0 },
        pembiayaan: { total: 0, count: 0 }
    };
    
    result.data.forEach(item => {
        if (summary[item.kategori]) {
            summary[item.kategori].total += item.nilai;
            summary[item.kategori].count += 1;
        }
    });
    
    return summary;
}

function setupDashboardEventListeners() {
    const yearSelect = document.getElementById('yearSelect');
    if (yearSelect) {
        yearSelect.addEventListener('change', function() {
            const selectedYear = this.value;
            loadDashboardData(selectedYear || null);
        });
    }
}

// Category Page Functions
async function initializeCategoryPage(category) {
    try {
        showLoading();
        
        // Load category data
        await loadCategoryData(category);
        
        // Load available years
        await loadAvailableYears('yearFilter');
        
        // Setup event listeners
        setupCategoryEventListeners(category);
        
    } catch (error) {
        console.error('Category page initialization error:', error);
        showMessage('Gagal memuat data kategori: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function loadCategoryData(category, filters = {}) {
    try {
        const result = await SupabaseAPI.getDataByCategory(category, filters.tahun);
        
        if (!result.success) {
            throw new Error(result.error);
        }
        
        currentData = result.data;
        
        // Update summary
        updateCategorySummary(category, result.data);
        
        // Create chart
        createCategoryChart(category, result.data, filters.view || 'top10');
        
        // Update table
        updateCategoryTable(category, result.data);
        
    } catch (error) {
        console.error('Load category data error:', error);
        showMessage('Gagal memuat data: ' + error.message, 'error');
    }
}

function updateCategorySummary(category, data) {
    const total = data.reduce((sum, item) => sum + item.nilai, 0);
    const count = data.length;
    
    const valueElement = document.getElementById(`total${capitalize(category)}Value`);
    const countElement = document.getElementById(`total${capitalize(category)}Count`);
    
    if (valueElement) valueElement.textContent = SupabaseAPI.formatCurrency(total);
    if (countElement) countElement.textContent = `${count} item`;
}

function createCategoryChart(category, data, viewType = 'top10') {
    const chartId = `${category}Chart`;
    
    if (data.length === 0) {
        const canvas = document.getElementById(chartId);
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = '16px Arial';
            ctx.fillStyle = '#718096';
            ctx.textAlign = 'center';
            ctx.fillText('Belum ada data untuk ditampilkan', canvas.width / 2, canvas.height / 2);
        }
        return;
    }
    
    // Aggregate data by subkategori
    const aggregated = {};
    data.forEach(item => {
        if (!aggregated[item.subkategori]) {
            aggregated[item.subkategori] = 0;
        }
        aggregated[item.subkategori] += item.nilai;
    });
    
    // Convert to array and sort
    const sortedData = Object.entries(aggregated)
        .map(([subkategori, nilai]) => ({ subkategori, nilai }))
        .sort((a, b) => b.nilai - a.nilai);
    
    let chartData, chartType = 'bar';
    
    if (viewType === 'top10' && sortedData.length > 10) {
        // Show top 10 + others
        const top10 = sortedData.slice(0, 10);
        const othersTotal = sortedData.slice(10).reduce((sum, item) => sum + item.nilai, 0);
        
        if (othersTotal > 0) {
            top10.push({ subkategori: 'Lainnya', nilai: othersTotal });
        }
        
        chartData = {
            labels: top10.map(item => item.subkategori),
            datasets: [{
                data: top10.map(item => item.nilai),
                backgroundColor: generateColors(top10.length),
                borderWidth: 1
            }]
        };
        
        // Show "Show All" button
        const showAllBtn = document.getElementById('showAllBtn');
        if (showAllBtn) {
            showAllBtn.style.display = 'inline-block';
            showAllBtn.onclick = () => {
                document.getElementById('chartView').value = 'all';
                createCategoryChart(category, data, 'all');
            };
        }
    } else if (viewType === 'all') {
        // Show all data (scrollable if needed)
        chartData = {
            labels: sortedData.map(item => item.subkategori),
            datasets: [{
                data: sortedData.map(item => item.nilai),
                backgroundColor: generateColors(sortedData.length),
                borderWidth: 1
            }]
        };
        
        // Hide "Show All" button
        const showAllBtn = document.getElementById('showAllBtn');
        if (showAllBtn) {
            showAllBtn.style.display = 'none';
        }
        
        // Make chart scrollable if too many items
        if (sortedData.length > 15) {
            chartType = 'horizontalBar';
        }
    } else if (viewType === 'stacked') {
        // Group by year and subkategori
        const yearlyData = {};
        data.forEach(item => {
            if (!yearlyData[item.tahun]) {
                yearlyData[item.tahun] = {};
            }
            if (!yearlyData[item.tahun][item.subkategori]) {
                yearlyData[item.tahun][item.subkategori] = 0;
            }
            yearlyData[item.tahun][item.subkategori] += item.nilai;
        });
        
        const years = Object.keys(yearlyData).sort();
        const allSubkategori = [...new Set(data.map(item => item.subkategori))];
        
        chartData = {
            labels: years,
            datasets: allSubkategori.map((subkat, index) => ({
                label: subkat,
                data: years.map(year => yearlyData[year][subkat] || 0),
                backgroundColor: generateColors(allSubkategori.length)[index],
                borderWidth: 1
            }))
        };
        
        chartType = 'bar';
    }
    
    const config = {
        type: chartType,
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: viewType === 'stacked',
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = viewType === 'stacked' ? context.dataset.label : context.label;
                            const value = SupabaseAPI.formatCurrency(context.parsed.y || context.parsed);
                            return `${label}: ${value}`;
                        }
                    }
                }
            },
            scales: viewType === 'stacked' ? {
                x: {
                    stacked: true
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return SupabaseAPI.formatCurrency(value);
                        }
                    }
                }
            } : {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return SupabaseAPI.formatCurrency(value);
                        }
                    }
                }
            }
        }
    };
    
    createChart(chartId, config);
}

function updateCategoryTable(category, data) {
    const tableBodyId = `${category}TableBody`;
    const tbody = document.getElementById(tableBodyId);
    
    if (!tbody) return;
    
    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="no-data">Belum ada data ${category}</td></tr>`;
        return;
    }
    
    tbody.innerHTML = data.map(item => `
        <tr>
            <td>${item.tahun}</td>
            <td>${item.subkategori}</td>
            <td>${item.uraian || '-'}</td>
            <td>${SupabaseAPI.formatCurrency(item.nilai)}</td>
        </tr>
    `).join('');
}

function setupCategoryEventListeners(category) {
    const yearFilter = document.getElementById('yearFilter');
    const chartView = document.getElementById('chartView');
    
    if (yearFilter) {
        yearFilter.addEventListener('change', function() {
            const filters = {
                tahun: this.value || null,
                view: chartView ? chartView.value : 'top10'
            };
            loadCategoryData(category, filters);
        });
    }
    
    if (chartView) {
        chartView.addEventListener('change', function() {
            const filters = {
                tahun: yearFilter ? yearFilter.value || null : null,
                view: this.value
            };
            loadCategoryData(category, filters);
        });
    }
}

// Admin Page Functions
async function initializeAdminPage() {
    try {
        // Check authentication state
        const userResult = await SupabaseAPI.getCurrentUser();
        
        if (userResult.success && userResult.user) {
            currentUser = userResult.user;
            showAdminPanel();
            await loadAdminData();
        } else {
            showLoginForm();
        }
        
        // Setup auth state listener
        SupabaseAPI.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                currentUser = session.user;
                showAdminPanel();
                loadAdminData();
            } else if (event === 'SIGNED_OUT') {
                currentUser = null;
                showLoginForm();
            }
        });
        
        // Setup event listeners
        setupAdminEventListeners();
        
    } catch (error) {
        console.error('Admin page initialization error:', error);
        showMessage('Gagal memuat halaman admin: ' + error.message, 'error');
        showLoginForm();
    }
}

function showLoginForm() {
    document.getElementById('loginSection').style.display = 'flex';
    document.getElementById('adminPanel').style.display = 'none';
}

function showAdminPanel() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    
    const adminEmail = document.getElementById('adminEmail');
    if (adminEmail && currentUser) {
        adminEmail.textContent = currentUser.email;
    }
}

async function loadAdminData(filters = {}) {
    try {
        showLoading();
        
        const result = await SupabaseAPI.getAllData({
            ...filters,
            limit: itemsPerPage,
            offset: (currentPage - 1) * itemsPerPage
        });
        
        if (!result.success) {
            throw new Error(result.error);
        }
        
        // Update admin table
        updateAdminTable(result.data);
        
        // Load filter options
        await loadAvailableYears('filterTahun');
        
        // Update pagination (simplified - you might want to implement proper pagination)
        updatePagination(result.data.length);
        
    } catch (error) {
        console.error('Load admin data error:', error);
        showMessage('Gagal memuat data admin: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function updateAdminTable(data) {
    const tbody = document.getElementById('adminTableBody');
    
    if (!tbody) return;
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">Belum ada data</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.map(item => `
        <tr>
            <td>${item.id}</td>
            <td>${item.tahun}</td>
            <td>${capitalize(item.kategori)}</td>
            <td>${item.subkategori}</td>
            <td>${item.uraian || '-'}</td>
            <td>${SupabaseAPI.formatCurrency(item.nilai)}</td>
            <td>
                <button class="btn btn-danger" onclick="confirmDelete(${item.id})">
                    Hapus
                </button>
            </td>
        </tr>
    `).join('');
}

function updatePagination(dataLength) {
    const pageInfo = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    
    if (pageInfo) {
        pageInfo.textContent = `Page ${currentPage}`;
    }
    
    if (prevBtn) {
        prevBtn.disabled = currentPage <= 1;
    }
    
    if (nextBtn) {
        nextBtn.disabled = dataLength < itemsPerPage;
    }
}

function setupAdminEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Add record form
    const addRecordForm = document.getElementById('addRecordForm');
    if (addRecordForm) {
        addRecordForm.addEventListener('submit', handleAddRecord);
    }
    
    // Filter controls
    const filterKategori = document.getElementById('filterKategori');
    const filterTahun = document.getElementById('filterTahun');
    
    if (filterKategori) {
        filterKategori.addEventListener('change', handleFilterChange);
    }
    
    if (filterTahun) {
        filterTahun.addEventListener('change', handleFilterChange);
    }
    
    // Pagination
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                loadAdminData(getCurrentFilters());
            }
        });
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            currentPage++;
            loadAdminData(getCurrentFilters());
        });
    }
    
    // Delete modal
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    const cancelDeleteBtn = document.getElementById('cancelDelete');
    
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', handleConfirmDelete);
    }
    
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', hideDeleteModal);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');
    
    try {
        showLoading();
        
        const result = await SupabaseAPI.signIn(email, password);
        
        if (!result.success) {
            throw new Error(result.error);
        }
        
        showMessage('Login berhasil!', 'success');
        
        // Clear form
        document.getElementById('loginForm').reset();
        errorDiv.style.display = 'none';
        
    } catch (error) {
        console.error('Login error:', error);
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
    } finally {
        hideLoading();
    }
}

async function handleLogout() {
    try {
        showLoading();
        
        const result = await SupabaseAPI.signOut();
        
        if (!result.success) {
            throw new Error(result.error);
        }
        
        showMessage('Logout berhasil!', 'success');
        
    } catch (error) {
        console.error('Logout error:', error);
        showMessage('Gagal logout: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function handleAddRecord(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const recordData = {
        tahun: formData.get('tahun'),
        kategori: formData.get('kategori'),
        subkategori: formData.get('subkategori'),
        uraian: formData.get('uraian'),
        nilai: formData.get('nilai')
    };
    
    try {
        showLoading();
        
        const result = await SupabaseAPI.addRecord(recordData);
        
        if (!result.success) {
            throw new Error(result.error);
        }
        
        showMessage('Data berhasil ditambahkan!', 'success');
        
        // Clear form
        e.target.reset();
        
        // Reload admin data
        await loadAdminData(getCurrentFilters());
        
    } catch (error) {
        console.error('Add record error:', error);
        showMessage('Gagal menambah data: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function handleFilterChange() {
    currentPage = 1; // Reset to first page
    loadAdminData(getCurrentFilters());
}

function getCurrentFilters() {
    const filterKategori = document.getElementById('filterKategori');
    const filterTahun = document.getElementById('filterTahun');
    
    return {
        kategori: filterKategori ? filterKategori.value || null : null,
        tahun: filterTahun ? filterTahun.value || null : null
    };
}

// Delete confirmation
let pendingDeleteId = null;

function confirmDelete(id) {
    pendingDeleteId = id;
    document.getElementById('deleteModal').style.display = 'flex';
}

function hideDeleteModal() {
    pendingDeleteId = null;
    document.getElementById('deleteModal').style.display = 'none';
}

async function handleConfirmDelete() {
    if (!pendingDeleteId) return;
    
    try {
        showLoading();
        
        const result = await SupabaseAPI.deleteRecord(pendingDeleteId);
        
        if (!result.success) {
            throw new Error(result.error);
        }
        
        showMessage('Data berhasil dihapus!', 'success');
        
        // Reload admin data
        await loadAdminData(getCurrentFilters());
        
    } catch (error) {
        console.error('Delete record error:', error);
        showMessage('Gagal menghapus data: ' + error.message, 'error');
    } finally {
        hideDeleteModal();
        hideLoading();
    }
}

// Utility Functions
async function loadAvailableYears(selectId) {
    try {
        const result = await SupabaseAPI.getAvailableYears();
        
        if (!result.success) return;
        
        const select = document.getElementById(selectId);
        if (!select) return;
        
        // Clear existing options except "all years"
        const firstOption = select.firstElementChild;
        select.innerHTML = '';
        if (firstOption) {
            select.appendChild(firstOption);
        }
        
        // Add year options
        result.data.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Load years error:', error);
    }
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function generateColors(count) {
    const colors = [
        '#3182ce', '#38a169', '#d53f8c', '#dd6b20', '#805ad5',
        '#0078d4', '#00b4d8', '#f77f00', '#d62828', '#7209b7',
        '#2a9d8f', '#e76f51', '#f4a261', '#e9c46a', '#264653'
    ];
    
    const result = [];
    for (let i = 0; i < count; i++) {
        result.push(colors[i % colors.length]);
    }
    return result;
}

// Global functions for HTML onclick events
window.confirmDelete = confirmDelete;
window.hideDeleteModal = hideDeleteModal;
window.initializeDashboard = initializeDashboard;
window.initializeCategoryPage = initializeCategoryPage;
window.initializeAdminPage = initializeAdminPage;
