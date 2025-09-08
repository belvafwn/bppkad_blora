// Konfigurasi Supabase
const SUPABASE_URL = 'https://scernchnrrfmdxtqrxrd.supabase.co';  // Ganti dengan URL Supabase Anda
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjZXJuY2hucnJmbWR4dHFyeHJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3OTYxNDYsImV4cCI6MjA3MjM3MjE0Nn0.UWUcsuPl5JJ7Batu6PBt4gMyTiosTqTQJ6Ile0eFV_U';  // Ganti dengan API Key Supabase Anda

// Initialize Supabase client
let supabase;

// Check if Supabase is configured
if (SUPABASE_URL !== 'https://scernchnrrfmdxtqrxrd.supabase.co' && SUPABASE_KEY !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjZXJuY2hucnJmbWR4dHFyeHJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3OTYxNDYsImV4cCI6MjA3MjM3MjE0Nn0.UWUcsuPl5JJ7Batu6PBt4gMyTiosTqTQJ6Ile0eFV_U') {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

// Global variables
let isAdminMode = false;
let allData = [];
let charts = {};

// Sample data untuk demo (ketika Supabase belum dikonfigurasi)
const sampleData = [
    { id: 1, tahun: 2017, kategori: 'Pendapatan', subkategori: 'Pajak Daerah', nilai: 50000000000 },
    { id: 2, tahun: 2017, kategori: 'Pendapatan', subkategori: 'Retribusi Daerah', nilai: 25000000000 },
    { id: 3, tahun: 2017, kategori: 'Pembelanjaan', subkategori: 'Belanja Pegawai', nilai: 80000000000 },
    { id: 4, tahun: 2017, kategori: 'Pembelanjaan', subkategori: 'Belanja Barang dan Jasa', nilai: 45000000000 },
    { id: 5, tahun: 2018, kategori: 'Pendapatan', subkategori: 'Pajak Daerah', nilai: 55000000000 },
    { id: 6, tahun: 2018, kategori: 'Pendapatan', subkategori: 'Retribusi Daerah', nilai: 28000000000 },
    { id: 7, tahun: 2018, kategori: 'Pembelanjaan', subkategori: 'Belanja Pegawai', nilai: 85000000000 },
    { id: 8, tahun: 2018, kategori: 'Pembiayaan', subkategori: 'Penerimaan Pembiayaan', nilai: 15000000000 },
    { id: 9, tahun: 2019, kategori: 'Pendapatan', subkategori: 'Pajak Daerah', nilai: 60000000000 },
    { id: 10, tahun: 2019, kategori: 'Pembelanjaan', subkategori: 'Belanja Modal', nilai: 35000000000 },
    { id: 11, tahun: 2020, kategori: 'Pendapatan', subkategori: 'Pajak Daerah', nilai: 58000000000 },
    { id: 12, tahun: 2020, kategori: 'Pembelanjaan', subkategori: 'Belanja Pegawai', nilai: 90000000000 },
    { id: 13, tahun: 2021, kategori: 'Pendapatan', subkategori: 'Dana Alokasi Umum', nilai: 120000000000 },
    { id: 14, tahun: 2021, kategori: 'Pembiayaan', subkategori: 'Penerimaan Daerah Lainnya', nilai: 20000000000 },
    { id: 15, tahun: 2022, kategori: 'Pendapatan', subkategori: 'Pajak Daerah', nilai: 65000000000 },
    { id: 16, tahun: 2022, kategori: 'Pembelanjaan', subkategori: 'Belanja Modal', nilai: 40000000000 },
    { id: 17, tahun: 2023, kategori: 'Pendapatan', subkategori: 'Retribusi Daerah', nilai: 35000000000 },
    { id: 18, tahun: 2023, kategori: 'Pembelanjaan', subkategori: 'Belanja Pegawai', nilai: 95000000000 },
    { id: 19, tahun: 2024, kategori: 'Pendapatan', subkategori: 'Pajak Daerah', nilai: 70000000000 },
    { id: 20, tahun: 2024, kategori: 'Pembiayaan', subkategori: 'Penerimaan Pembiayaan', nilai: 25000000000 }
];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 BPPKAD Blora Website Initialized');
    loadAllData();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    const form = document.getElementById('dataForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
}

// Show message to user
function showMessage(message, type = 'success') {
    const container = document.getElementById('messageContainer');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    container.innerHTML = '';
    container.appendChild(messageDiv);
    
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Format number with thousand separators
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Toggle admin mode
function toggleAdmin() {
    isAdminMode = !isAdminMode;
    const adminPanel = document.getElementById('adminPanel');
    const adminToggle = document.querySelector('.admin-toggle');
    
    if (isAdminMode) {
        adminPanel.style.display = 'block';
        adminToggle.textContent = 'User Mode';
        adminToggle.style.background = '#27ae60';
        showMessage('Mode Admin diaktifkan. Anda dapat mengelola data APBD.', 'success');
    } else {
        adminPanel.style.display = 'none';
        adminToggle.textContent = 'Admin Mode';
        adminToggle.style.background = '#e74c3c';
    }
}

// Show section
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected section
    const section = document.getElementById(sectionName);
    if (section) {
        section.classList.add('active');
    }
    
    // Add active class to clicked nav item
    event.target.classList.add('active');
    
    // Load specific data based on section
    if (sectionName !== 'dashboard') {
        loadSectionData(sectionName);
    }
}

// Load all data
async function loadAllData() {
    console.log('📥 Loading all data...');
    
    if (!supabase) {
        console.log('⚠️ Supabase not configured, using sample data');
        allData = sampleData;
        updateDashboard();
        return;
    }

    try {
        const { data, error } = await supabase
            .from('apbd_data')
            .select('*')
            .order('tahun', { ascending: true });

        if (error) {
            console.error('Error loading data:', error);
            showMessage('Error memuat data: ' + error.message, 'error');
            allData = sampleData; // Fallback to sample data
        } else {
            allData = data || [];
            console.log(`✅ Loaded ${allData.length} records`);
        }
    } catch (error) {
        console.error('Network error:', error);
        showMessage('Koneksi database bermasalah, menggunakan data sample.', 'error');
        allData = sampleData;
    }

    updateDashboard();
}

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = {
        tahun: parseInt(document.getElementById('tahun').value),
        kategori: document.getElementById('kategori').value,
        subkategori: document.getElementById('subkategori').value,
        nilai: parseInt(document.getElementById('nilai').value)
    };

    console.log('💾 Saving data:', formData);

    if (!supabase) {
        // Simulate saving to sample data
        const newId = Math.max(...allData.map(d => d.id || 0)) + 1;
        allData.push({ id: newId, ...formData });
        showMessage('Data berhasil disimpan ke storage lokal!', 'success');
        document.getElementById('dataForm').reset();
        updateDashboard();
        return;
    }

    try {
        const { data, error } = await supabase
            .from('apbd_data')
            .insert([formData])
            .select();

        if (error) {
            console.error('Error saving data:', error);
            showMessage('Error menyimpan data: ' + error.message, 'error');
        } else {
            showMessage('Data berhasil disimpan!', 'success');
            document.getElementById('dataForm').reset();
            loadAllData(); // Reload all data
        }
    } catch (error) {
        console.error('Network error:', error);
        showMessage('Koneksi database bermasalah.', 'error');
    }
}

// Delete data
async function deleteData(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) {
        return;
    }

    console.log('🗑️ Deleting data with ID:', id);

    if (!supabase) {
        allData = allData.filter(d => d.id !== id);
        showMessage('Data berhasil dihapus dari storage lokal!', 'success');
        updateDashboard();
        // Refresh current section if not dashboard
        const activeSection = document.querySelector('.section.active');
        if (activeSection.id !== 'dashboard') {
            loadSectionData(activeSection.id);
        }
        return;
    }

    try {
        const { error } = await supabase
            .from('apbd_data')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting data:', error);
            showMessage('Error menghapus data: ' + error.message, 'error');
        } else {
            showMessage('Data berhasil dihapus!', 'success');
            loadAllData();
        }
    } catch (error) {
        console.error('Network error:', error);
        showMessage('Koneksi database bermasalah.', 'error');
    }
}

// Update dashboard
function updateDashboard() {
    console.log('📊 Updating dashboard...');
    
    // Group data by year and category for dashboard
    const yearlyData = {};
    
    allData.forEach(item => {
        if (!yearlyData[item.tahun]) {
            yearlyData[item.tahun] = {
                Pendapatan: 0,
                Pembelanjaan: 0,
                Pembiayaan: 0
            };
        }
        yearlyData[item.tahun][item.kategori] = 
            (yearlyData[item.tahun][item.kategori] || 0) + item.nilai;
    });

    const years = Object.keys(yearlyData).sort();
    const pendapatanData = years.map(year => yearlyData[year]?.Pendapatan || 0);
    const pembelanjaanData = years.map(year => yearlyData[year]?.Pembelanjaan || 0);
    const pembiayaanData = years.map(year => yearlyData[year]?.Pembiayaan || 0);

    // Destroy existing chart if it exists
    if (charts.dashboard) {
        charts.dashboard.destroy();
    }

    // Create dashboard chart
    const ctx = document.getElementById('dashboardChart');
    if (ctx) {
        charts.dashboard = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: years,
                datasets: [
                    {
                        label: 'Pendapatan',
                        data: pendapatanData,
                        backgroundColor: 'rgba(52, 152, 219, 0.8)',
                        borderColor: 'rgba(52, 152, 219, 1)',
                        borderWidth: 2
                    },
                    {
                        label: 'Pembelanjaan',
                        data: pembelanjaanData,
                        backgroundColor: 'rgba(231, 76, 60, 0.8)',
                        borderColor: 'rgba(231, 76, 60, 1)',
                        borderWidth: 2
                    },
                    {
                        label: 'Pembiayaan',
                        data: pembiayaanData,
                        backgroundColor: 'rgba(39, 174, 96, 0.8)',
                        borderColor: 'rgba(39, 174, 96, 1)',
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Perbandingan Realisasi APBD Per Tahun',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'Rp ' + (value / 1000000000).toFixed(1) + 'M';
                            }
                        }
                    }
                }
            }
        });
    }
}

// Load section data
function loadSectionData(sectionName) {
    console.log(`📈 Loading ${sectionName} data...`);
    
    const categoryData = allData.filter(item => 
        item.kategori.toLowerCase() === sectionName.toLowerCase()
    );

    if (categoryData.length === 0) {
        showEmptyState(sectionName);
        return;
    }

    // Group by subkategori for better visualization
    const subkategoriData = {};
    categoryData.forEach(item => {
        if (!subkategoriData[item.subkategori]) {
            subkategoriData[item.subkategori] = {};
        }
        subkategoriData[item.subkategori][item.tahun] = item.nilai;
    });

    createSectionCharts(sectionName, subkategoriData);
    createSectionTable(sectionName, categoryData);
}

// Show empty state
function showEmptyState(sectionName) {
    const loadingElement = document.getElementById(`${sectionName}Loading`);
    const chartsContainer = document.getElementById(`${sectionName}Charts`);
    const tableContainer = document.getElementById(`${sectionName}Table`);
    
    if (loadingElement) loadingElement.style.display = 'none';
    if (tableContainer) tableContainer.style.display = 'none';
    
    if (chartsContainer) {
        chartsContainer.innerHTML = `
            <div class="chart-container">
                <h3 class="chart-title">Tidak ada data untuk kategori ${sectionName}</h3>
                <p style="text-align: center; color: #666; padding: 40px;">
                    Silakan tambahkan data melalui panel admin.
                </p>
            </div>
        `;
    }
}

// Create section charts
function createSectionCharts(sectionName, subkategoriData) {
    const loadingElement = document.getElementById(`${sectionName}Loading`);
    const chartsContainer = document.getElementById(`${sectionName}Charts`);
    
    if (loadingElement) loadingElement.style.display = 'none';
    if (!chartsContainer) return;

    chartsContainer.innerHTML = '';

    // Create chart for each subkategori
    Object.keys(subkategoriData).forEach((subkategori, index) => {
        const chartContainer = document.createElement('div');
        chartContainer.className = 'chart-container';
        
        const chartTitle = document.createElement('h3');
        chartTitle.className = 'chart-title';
        chartTitle.textContent = subkategori;
        
        const chartWrapper = document.createElement('div');
        chartWrapper.className = 'chart-wrapper';
        
        const canvas = document.createElement('canvas');
        canvas.id = `${sectionName}Chart${index}`;
        
        chartWrapper.appendChild(canvas);
        chartContainer.appendChild(chartTitle);
        chartContainer.appendChild(chartWrapper);
        chartsContainer.appendChild(chartContainer);

        // Prepare chart data
        const years = Object.keys(subkategoriData[subkategori]).sort();
        const values = years.map(year => subkategoriData[subkategori][year] || 0);

        // Color schemes
        const colors = [
            'rgba(52, 152, 219, 0.8)',
            'rgba(231, 76, 60, 0.8)',
            'rgba(39, 174, 96, 0.8)',
            'rgba(155, 89, 182, 0.8)',
            'rgba(241, 196, 15, 0.8)',
            'rgba(230, 126, 34, 0.8)'
        ];

        // Create chart
        new Chart(canvas, {
            type: 'line',
            data: {
                labels: years,
                datasets: [{
                    label: 'Realisasi (Rp)',
                    data: values,
                    backgroundColor: colors[index % colors.length],
                    borderColor: colors[index % colors.length].replace('0.8', '1'),
                    borderWidth: 3,
                    fill: false,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                if (value >= 1000000000) {
                                    return 'Rp ' + (value / 1000000000).toFixed(1) + 'M';
                                } else if (value >= 1000000) {
                                    return 'Rp ' + (value / 1000000).toFixed(1) + 'Jt';
                                }
                                return 'Rp ' + formatNumber(value);
                            }
                        }
                    }
                }
            }
        });
    });
}

// Create section table
function createSectionTable(sectionName, categoryData) {
    const tableContainer = document.getElementById(`${sectionName}Table`);
    const tableBody = document.getElementById(`${sectionName}TableBody`);
    
    if (!tableContainer || !tableBody) return;

    tableBody.innerHTML = '';
    
    // Sort data by year desc, then by subkategori
    categoryData.sort((a, b) => {
        if (a.tahun !== b.tahun) return b.tahun - a.tahun;
        return a.subkategori.localeCompare(b.subkategori);
    });

    categoryData.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.tahun}</td>
            <td>${item.subkategori}</td>
            <td>${formatCurrency(item.nilai)}</td>
            <td>
                ${isAdminMode ? `<button class="btn btn-danger" onclick="deleteData(${item.id})">Hapus</button>` : '-'}
            </td>
        `;
        tableBody.appendChild(row);
    });

    tableContainer.style.display = 'block';
}

// Utility functions for number formatting
function abbreviateNumber(value) {
    if (value >= 1000000000) {
        return (value / 1000000000).toFixed(1) + 'M';
    } else if (value >= 1000000) {
        return (value / 1000000).toFixed(1) + 'Jt';
    } else if (value >= 1000) {
        return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
}