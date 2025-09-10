// Supabase Configuration
// IMPORTANT: Replace these placeholders with your actual Supabase credentials
// You can find these in your Supabase project dashboard
const SUPABASE_URL = 'https://scernchnrrfmdxtqrxrd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjZXJuY2hucnJmbWR4dHFyeHJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3OTYxNDYsImV4cCI6MjA3MjM3MjE0Nn0.UWUcsuPl5JJ7Batu6PBt4gMyTiosTqTQJ6Ile0eFV_U';

// Import Supabase client from CDN (loaded in HTML)
const { createClient } = supabase;

// Initialize Supabase client
const supabaseClient = createClient(SUPABASE_URL , SUPABASE_ANON_KEY;

// Database table name
const TABLE_NAME = 'realisasi_apbd';

// Supabase API wrapper functions
const SupabaseAPI = {
    // Authentication functions
    async signIn(email, password) {
        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            });
            
            if (error) throw error;
            return { success: true, data: data };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: error.message };
        }
    },

    async signOut() {
        try {
            const { error } = await supabaseClient.auth.signOut();
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    },

    async getCurrentUser() {
        try {
            const { data: { user }, error } = await supabaseClient.auth.getUser();
            if (error) throw error;
            return { success: true, user: user };
        } catch (error) {
            console.error('Get user error:', error);
            return { success: false, error: error.message };
        }
    },

    async onAuthStateChange(callback) {
        return supabaseClient.auth.onAuthStateChange((event, session) => {
            callback(event, session);
        });
    },

    // Data retrieval functions
    async getAllData(filters = {}) {
        try {
            let query = supabaseClient
                .from(TABLE_NAME)
                .select('*')
                .order('tahun', { ascending: false })
                .order('created_at', { ascending: false });

            // Apply filters
            if (filters.kategori) {
                query = query.eq('kategori', filters.kategori);
            }
            if (filters.tahun) {
                query = query.eq('tahun', filters.tahun);
            }
            if (filters.limit) {
                query = query.limit(filters.limit);
            }
            if (filters.offset) {
                query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
            }

            const { data, error } = await query;
            
            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('Get data error:', error);
            return { success: false, error: error.message, data: [] };
        }
    },

    async getDataByCategory(kategori, tahun = null) {
        try {
            let query = supabaseClient
                .from(TABLE_NAME)
                .select('*')
                .eq('kategori', kategori)
                .order('tahun', { ascending: false })
                .order('nilai', { ascending: false });

            if (tahun) {
                query = query.eq('tahun', tahun);
            }

            const { data, error } = await query;
            
            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('Get category data error:', error);
            return { success: false, error: error.message, data: [] };
        }
    },

    async getSummaryData() {
        try {
            const { data, error } = await supabaseClient
                .from(TABLE_NAME)
                .select('kategori, nilai, tahun');
            
            if (error) throw error;

            // Process summary data
            const summary = {
                pendapatan: { total: 0, count: 0 },
                pembelanjaan: { total: 0, count: 0 },
                pembiayaan: { total: 0, count: 0 }
            };

            const yearlyData = {};

            data.forEach(item => {
                // Category totals
                if (summary[item.kategori]) {
                    summary[item.kategori].total += item.nilai;
                    summary[item.kategori].count += 1;
                }

                // Yearly data
                if (!yearlyData[item.tahun]) {
                    yearlyData[item.tahun] = {
                        pendapatan: 0,
                        pembelanjaan: 0,
                        pembiayaan: 0
                    };
                }
                yearlyData[item.tahun][item.kategori] += item.nilai;
            });

            return { 
                success: true, 
                data: { summary, yearlyData, rawData: data } 
            };
        } catch (error) {
            console.error('Get summary error:', error);
            return { success: false, error: error.message };
        }
    },

    async getAvailableYears() {
        try {
            const { data, error } = await supabaseClient
                .from(TABLE_NAME)
                .select('tahun')
                .order('tahun', { ascending: false });
            
            if (error) throw error;

            const uniqueYears = [...new Set(data.map(item => item.tahun))];
            return { success: true, data: uniqueYears };
        } catch (error) {
            console.error('Get years error:', error);
            return { success: false, error: error.message, data: [] };
        }
    },

    // Data manipulation functions (require authentication)
    async addRecord(recordData) {
        try {
            // Validate required fields
            const { tahun, kategori, subkategori, nilai, uraian } = recordData;
            
            if (!tahun || !kategori || !subkategori || !nilai) {
                throw new Error('Data tidak lengkap. Mohon lengkapi semua field yang wajib.');
            }

            // Validate data types
            if (isNaN(tahun) || isNaN(nilai)) {
                throw new Error('Tahun dan nilai harus berupa angka.');
            }

            if (nilai <= 0) {
                throw new Error('Nilai harus lebih besar dari 0.');
            }

            if (!['pendapatan', 'pembelanjaan', 'pembiayaan'].includes(kategori)) {
                throw new Error('Kategori tidak valid.');
            }

            const { data, error } = await supabaseClient
                .from(TABLE_NAME)
                .insert([{
                    tahun: parseInt(tahun),
                    kategori: kategori.toLowerCase(),
                    subkategori: subkategori.trim(),
                    uraian: uraian ? uraian.trim() : null,
                    nilai: parseFloat(nilai),
                    created_at: new Date().toISOString()
                }])
                .select();
            
            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Add record error:', error);
            return { success: false, error: error.message };
        }
    },

    async updateRecord(id, recordData) {
        try {
            const { tahun, kategori, subkategori, nilai, uraian } = recordData;
            
            if (!tahun || !kategori || !subkategori || !nilai) {
                throw new Error('Data tidak lengkap. Mohon lengkapi semua field yang wajib.');
            }

            if (isNaN(tahun) || isNaN(nilai)) {
                throw new Error('Tahun dan nilai harus berupa angka.');
            }

            if (nilai <= 0) {
                throw new Error('Nilai harus lebih besar dari 0.');
            }

            const { data, error } = await supabaseClient
                .from(TABLE_NAME)
                .update({
                    tahun: parseInt(tahun),
                    kategori: kategori.toLowerCase(),
                    subkategori: subkategori.trim(),
                    uraian: uraian ? uraian.trim() : null,
                    nilai: parseFloat(nilai),
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select();
            
            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Update record error:', error);
            return { success: false, error: error.message };
        }
    },

    async deleteRecord(id) {
        try {
            const { error } = await supabaseClient
                .from(TABLE_NAME)
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Delete record error:', error);
            return { success: false, error: error.message };
        }
    },

    // Utility functions
    formatCurrency(value) {
        if (isNaN(value)) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(value);
    },

    formatNumber(value) {
        if (isNaN(value)) return '0';
        return new Intl.NumberFormat('id-ID').format(value);
    },

    // Check if Supabase is properly configured
    isConfigured() {
        return SUPABASE_URL !== 'REPLACE_WITH_SUPABASE_URL' && 
               SUPABASE_ANON_KEY !== 'REPLACE_WITH_SUPABASE_ANON_KEY' &&
               SUPABASE_URL.includes('supabase.co');
    },

    // Get configuration status
    getConfigStatus() {
        if (!this.isConfigured()) {
            return {
                configured: false,
                message: 'Supabase belum dikonfigurasi. Silakan ganti placeholder di js/supabase.js dengan URL dan key Supabase Anda.'
            };
        }
        return { configured: true };
    }
};

// Export for global use
window.SupabaseAPI = SupabaseAPI;

// Configuration check on load
document.addEventListener('DOMContentLoaded', function() {
    const configStatus = SupabaseAPI.getConfigStatus();
    if (!configStatus.configured) {
        console.warn('⚠️ ' + configStatus.message);
        
        // Show warning message to user
        const warningDiv = document.createElement('div');
        warningDiv.style.cssText = `
            position: fixed;
            top: 60px;
            left: 0;
            right: 0;
            background-color: #fed7d7;
            color: #742a2a;
            padding: 1rem;
            text-align: center;
            z-index: 1000;
            border-bottom: 1px solid #fc8181;
        `;
        warningDiv.innerHTML = `
            <strong>Konfigurasi Diperlukan:</strong> 
            Supabase belum dikonfigurasi. Silakan ikuti petunjuk di README.md untuk setup.
        `;
        document.body.insertBefore(warningDiv, document.body.firstChild);
    }

});

