const axios = require('axios');
const { db } = require('../config/firebase.config');

const EDAMAM_BASE_URL = 'https://api.edamam.com/api/recipes/v2';
const APP_ID = process.env.EDAMAM_APP_ID;
const APP_KEY = process.env.EDAMAM_APP_KEY;
const EDAMAM_USER = process.env.EDAMAM_USER_ID;

// 1. LOGIC MEAL TYPE BERDASARKAN WAKTU (WIB / UTC+7)
const getMealTypeByTime = () => {
    // Ambil waktu sekarang di Jakarta
    const now = new Date().toLocaleString("en-US", {timeZone: "Asia/Jakarta"});
    const hour = new Date(now).getHours();

    // 03.00 - 10.00 : Breakfast
    if (hour >= 3 && hour < 10) return ['Breakfast', 'Snack', 'Teatime'];
    // 10.01 - 18.00 : Lunch
    if (hour >= 10 && hour < 18) return ['Lunch', 'Snack', 'Teatime'];
    // 18.00 - 02.59 : Dinner
    return ['Dinner', 'Snack', 'Teatime'];
};

// 2. LOGIC SISA NUTRISI (Remaining Quota)
const calculateRemainingNutrition = async (uid, userProfile) => {
    // Format tanggal hari ini: YYYY-MM-DD
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
    
    const dailyRef = db.collection('users').doc(uid).collection('daily_logs').doc(today);
    const doc = await dailyRef.get();

    // Guard Clause: Pastikan ada nutritionalNeeds, kalau tidak pakai default
    const target = userProfile.nutritionalNeeds || { 
        calories: 2000, carbs: 250, fat: 60, protein: 100 
    };

    // Nutrisi yang sudah dikonsumsi (Default 0 jika belum ada log hari ini)
    let consumed = { calories: 0, carbs: 0, fat: 0, protein: 0 };

    if (doc.exists) {
        const data = doc.data();
        if (data.summary) {
            consumed = data.summary;
        }
    }

    // Hitung Sisa (Max untuk Edamam)
    // Minimal search value kita set agar hasil tetap muncul meskipun kuota habis
    return {
        calories: Math.max(100, target.calories - consumed.calories),
        carbs: Math.max(10, target.carbs - consumed.carbs),
        fat: Math.max(5, target.fat - consumed.fat),
        protein: Math.max(10, target.protein - consumed.protein)
    };
};

/**
 * Mencari rekomendasi resep ke Edamam
 * @param {string} foodLabel - Label makanan LANGSUNG dari ML (harus English/compatible)
 */
const getRecommendations = async (uid, userProfile, foodLabel) => {
    try {
        // A. Setup Query (Langsung pakai input parameter)
        const queryText = foodLabel; 
        const mealTypes = getMealTypeByTime();
        const maxNutrients = await calculateRemainingNutrition(uid, userProfile);
        
        // B. Setup Allergies
        // Default wajib: alcohol-free, pork-free
        let healthLabels = ['alcohol-free', 'pork-free'];
        
        // Tambah alergi user jika ada
        if (userProfile.preferences && userProfile.preferences.allergies) {
            healthLabels = [...healthLabels, ...userProfile.preferences.allergies];
        }

        // C. Construct URL Parameters
        const params = new URLSearchParams();
        
        params.append('type', 'public');
        params.append('q', queryText); 
        params.append('app_id', APP_ID);
        params.append('app_key', APP_KEY);
        
        // Meal Types
        mealTypes.forEach(type => params.append('mealType', type));
        
        // Health Labels
        healthLabels.forEach(label => params.append('health', label));
        
        // Cuisine Type Priorities
        params.append('cuisineType', 'South East Asian');
        params.append('cuisineType', 'Asian');
        
        // Nutrients Limits (MAX based on remaining quota)
        params.append('calories', `0-${Math.round(maxNutrients.calories)}`);
        params.append('nutrients[CHOCDF]', Math.round(maxNutrients.carbs)); 
        params.append('nutrients[FAT]', Math.round(maxNutrients.fat));      
        params.append('nutrients[PROCNT]', Math.round(maxNutrients.protein)); 
        
        params.append('imageSize', 'LARGE');
        params.append('random', 'true');

        // --- PERBAIKAN 1: Update Fields ---
        // Ganti 'ingredients' jadi 'ingredientLines' agar dapat teks yang bersih
        const fields = [
            'label', 
            'image', 
            'images', 
            'url', 
            'ingredientLines', // <-- FIELD PENTING (List bahan format text)
            'calories', 
            'totalWeight', 
            'totalTime', 
            'cuisineType', 
            'mealType', 
            'totalNutrients'
        ];
        
        fields.forEach(field => params.append('field', field));

        // D. Request ke Edamam
        const headers = {};
        if (EDAMAM_USER) headers['Edamam-Account-User'] = EDAMAM_USER;

        // --- 🕵️ DEBUGGER START ---
        const fullUrl = `${EDAMAM_BASE_URL}?${params.toString()}`;

        console.log("\n==========================================");
        console.log("🕵️  DEBUG EDAMAM REQUEST (SERVER SIDE)");
        console.log("------------------------------------------");
        console.log(`🔑 APP_ID Status: ${APP_ID ? '✅ Loaded (' + APP_ID + ')' : '❌ UNDEFINED'}`);
        console.log(`🔑 APP_KEY Status: ${APP_KEY ? '✅ Loaded' : '❌ UNDEFINED'}`);
        console.log(`🕒 Detected MealType: ${mealTypes.join(', ')}`);
        console.log(`🥗 Calculated Quota:`, maxNutrients);
        console.log("------------------------------------------");
        console.log(`🔗 FINAL URL (Copy & Paste to Browser to Test):`);
        console.log(fullUrl);
        console.log("==========================================\n");
        // --- 🕵️ DEBUGGER END ---

        const response = await axios.get(fullUrl, { headers });

        console.log(`✅ Edamam Success! Hits Found: ${response.data.count}`);

        // E. Saring & Format Response (Ambil 5 resep)
        const recipes = response.data.hits.slice(0, 5).map(hit => {
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
                
                // --- PERBAIKAN 2: Mapping Response ---
                // Ambil langsung dari ingredientLines (sudah array of strings)
                ingredients: r.ingredientLines || [], 

                nutrients: {
                    carbs: Math.round(r.totalNutrients.CHOCDF?.quantity || 0),
                    protein: Math.round(r.totalNutrients.PROCNT?.quantity || 0),
                    fat: Math.round(r.totalNutrients.FAT?.quantity || 0)
                }
            };
        });

        return {
            search_query: queryText,
            remaining_quota: maxNutrients,
            count: recipes.length,
            recipes: recipes
        };

    } catch (error) {
        console.error('❌ Edamam Service Error:', error.response?.data || error.message);
        
        return {
            search_query: foodLabel,
            remaining_quota: {},
            count: 0,
            recipes: []
        };
    }
};

module.exports = { getRecommendations };