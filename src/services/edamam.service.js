const axios = require('axios');
const { db } = require('../config/firebase.config');

const EDAMAM_BASE_URL = 'https://api.edamam.com/api/recipes/v2';
const APP_ID = process.env.EDAMAM_APP_ID;
const APP_KEY = process.env.EDAMAM_APP_KEY;
const EDAMAM_USER = process.env.EDAMAM_USER_ID;

// ==========================================
// SECTION 1: HELPER FUNCTIONS
// ==========================================

// 1. Logic Penentuan Jam Makan (WIB)
const getMealTypeByTime = () => {
    const now = new Date().toLocaleString("en-US", {timeZone: "Asia/Jakarta"});
    const hour = new Date(now).getHours();

    // 03.00 - 10.00 : Breakfast
    if (hour >= 3 && hour < 10) return ['Breakfast', 'Snack', 'Teatime'];
    // 10.01 - 18.00 : Lunch
    if (hour >= 10 && hour < 18) return ['Lunch', 'Snack', 'Teatime'];
    // 18.00 - 02.59 : Dinner
    return ['Dinner', 'Snack', 'Teatime'];
};

// 2. Logic Hitung Sisa Nutrisi Harian
const calculateRemainingNutrition = async (uid, userProfile) => {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
    const doc = await db.collection('users').doc(uid).collection('daily_logs').doc(today).get();

    // Default target jika belum ada di profile
    const target = userProfile.nutritionalNeeds || { calories: 2000, carbs: 250, fat: 60, protein: 100 };
    
    let consumed = { calories: 0, carbs: 0, fat: 0, protein: 0 };

    if (doc.exists && doc.data().summary) {
        consumed = doc.data().summary;
    }

    // Return sisa (Minimal search value diset agar hasil tetap muncul)
    return {
        calories: Math.max(100, target.calories - consumed.calories),
        carbs: Math.max(10, target.carbs - consumed.carbs),
        fat: Math.max(5, target.fat - consumed.fat),
        protein: Math.max(10, target.protein - consumed.protein)
    };
};

// 3. Formatter Response (Membersihkan Data Edamam)
const formatRecipes = (hits) => {
    return hits.slice(0, 5).map(hit => {
        const r = hit.recipe;
        return {
            label: r.label,
            image: r.images.LARGE ? r.images.LARGE.url : r.image,
            sourceUrl: r.url,
            calories: Math.round(r.calories),
            totalWeight: Math.round(r.totalWeight),
            time: r.totalTime,
            cuisineType: r.cuisineType,
            mealType: r.mealType,
            // Pakai ingredientLines agar formatnya Text Array, bukan Object
            ingredients: r.ingredientLines || [],
            nutrients: {
                carbs: Math.round(r.totalNutrients.CHOCDF?.quantity || 0),
                protein: Math.round(r.totalNutrients.PROCNT?.quantity || 0),
                fat: Math.round(r.totalNutrients.FAT?.quantity || 0)
            }
        };
    });
};

// ==========================================
// SECTION 2: EXPORTED FUNCTIONS
// ==========================================

/**
 * 1. REKOMENDASI HASIL SCAN (Fitur Predict)
 * - Query: Label dari ML (misal: "chicken")
 * - Quota: YA (Sesuai sisa gizi)
 * - Time: YA (Sesuai jam makan)
 */
const getRecommendations = async (uid, userProfile, foodLabel) => {
    return await fetchFromEdamam({
        uid, userProfile,
        query: foodLabel,
        useQuota: true, 
        useTime: true,  
        usePriorityCuisine: true 
    });
};

/**
 * 2. REKOMENDASI DASHBOARD OTOMATIS (Fitur Dashboard)
 * - Query: KOSONG (Biar random murni berdasarkan filter)
 * - Quota: YA (Sesuai sisa gizi)
 * - Time: YA (Sesuai jam makan)
 */
const getSmartRecommendations = async (uid, userProfile) => {
    return await fetchFromEdamam({
        uid, userProfile,
        query: '', // Kosong = Random Recommendation
        useQuota: true,
        useTime: true,
        usePriorityCuisine: true
    });
};

/**
 * 3. PENCARIAN MANUAL (Fitur Search)
 * - Query: Input User (misal: "seblak")
 * - Quota: TIDAK (Bebas)
 * - Time: TIDAK (Bebas)
 */
const searchRecipes = async (uid, userProfile, query) => {
    return await fetchFromEdamam({
        uid, userProfile,
        query: query,
        useQuota: false, 
        useTime: false,  
        usePriorityCuisine: false // Global search
    });
};

// ==========================================
// SECTION 3: CORE LOGIC (PRIVATE)
// ==========================================

const fetchFromEdamam = async ({ uid, userProfile, query, useQuota, useTime, usePriorityCuisine }) => {
    try {
        const params = new URLSearchParams();
        params.append('type', 'public');
        
        // LOGIC PENTING: Hanya tambah parameter 'q' jika query tidak kosong
        // Ini memungkinkan pencarian random murni untuk dashboard
        if (query && query.trim() !== '') {
            params.append('q', query);
        }
        
        params.append('app_id', APP_ID);
        params.append('app_key', APP_KEY);
        
        // A. Setup Alergi (Selalu dipakai)
        let healthLabels = ['alcohol-free', 'pork-free'];
        if (userProfile.preferences?.allergies) {
            healthLabels = [...healthLabels, ...userProfile.preferences.allergies];
        }
        healthLabels.forEach(label => params.append('health', label));

        // B. Setup Waktu (Opsional)
        if (useTime) {
            getMealTypeByTime().forEach(type => params.append('mealType', type));
        }

        // C. Setup Kuota / Sisa Gizi (Opsional)
        let quota = null;
        if (useQuota) {
            quota = await calculateRemainingNutrition(uid, userProfile);
            params.append('calories', `0-${Math.round(quota.calories)}`);
            params.append('nutrients[CHOCDF]', Math.round(quota.carbs));
            params.append('nutrients[FAT]', Math.round(quota.fat));
            params.append('nutrients[PROCNT]', Math.round(quota.protein));
        }

        // D. Setup Cuisine (Opsional - Prioritas Asia)
        if (usePriorityCuisine) {
            params.append('cuisineType', 'South East Asian');
            params.append('cuisineType', 'Asian');
        }

        // E. Parameter Wajib Lainnya
        params.append('imageSize', 'LARGE');
        params.append('random', 'true'); // Wajib random agar hasil bervariasi

        const fields = ['label', 'image', 'images', 'url', 'ingredientLines', 'calories', 'totalWeight', 'totalTime', 'cuisineType', 'mealType', 'totalNutrients'];
        fields.forEach(field => params.append('field', field));

        // F. Eksekusi Request
        const headers = {};
        if (EDAMAM_USER) headers['Edamam-Account-User'] = EDAMAM_USER;

        // --- DEBUGGER LOG ---
        console.log(`\n🔎 Edamam Request Info:`);
        console.log(`   Query: "${query || '(Random)'}"`);
        console.log(`   Filters: [Quota: ${useQuota ? 'ON' : 'OFF'}] [Time: ${useTime ? 'ON' : 'OFF'}]`);
        // Uncomment baris bawah ini jika ingin lihat URL lengkap di logs
        // console.log(`   URL: ${EDAMAM_BASE_URL}?${params.toString()}`);
        // --------------------

        const response = await axios.get(`${EDAMAM_BASE_URL}?${params.toString()}`, { headers });
        const recipes = formatRecipes(response.data.hits);

        return {
            search_query: query || 'Smart Recommendation',
            remaining_quota: quota, // null jika mode manual search
            count: recipes.length,
            recipes: recipes
        };

    } catch (error) {
        console.error('❌ Edamam Service Error:', error.response?.data || error.message);
        // Return kosong biar tidak crash (Mobile App handle empty state)
        return { 
            search_query: query, 
            remaining_quota: null, 
            count: 0, 
            recipes: [] 
        };
    }
};

module.exports = { 
    getRecommendations, 
    getSmartRecommendations, 
    searchRecipes 
};