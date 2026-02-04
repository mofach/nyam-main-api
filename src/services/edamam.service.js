const axios = require('axios');
const { db } = require('../config/firebase.config');

class EdamamService {
  constructor() {
    this.baseUrl = 'https://api.edamam.com/api/recipes/v2';
    this.appId = process.env.EDAMAM_APP_ID;
    this.appKey = process.env.EDAMAM_APP_KEY;
    this.userId = process.env.EDAMAM_USER_ID;
  }

  // --- PRIVATE METHODS ---

  _getMealTypeByTime() {
    const now = new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
    const hour = new Date(now).getHours();

    if (hour >= 3 && hour < 10) return ['Breakfast', 'Snack', 'Teatime'];
    if (hour >= 10 && hour < 18) return ['Lunch', 'Snack', 'Teatime'];
    return ['Dinner', 'Snack', 'Teatime'];
  }

  async _calculateRemainingNutrition(uid, userProfile) {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
    const dailyRef = db.collection('users').doc(uid).collection('daily_logs').doc(today);
    const doc = await dailyRef.get();

    const needs = userProfile.nutritionalNeeds || {};
    const target = { 
        calories: Number(needs.calories) || 2000, 
        carbs: Number(needs.carbs) || 250, 
        fat: Number(needs.fat) || 60, 
        protein: Number(needs.protein) || 100 
    };

    let consumed = { calories: 0, carbs: 0, fat: 0, protein: 0 };
    if (doc.exists && doc.data().summary) {
        const data = doc.data().summary;
        consumed = {
            calories: Number(data.totalCalories) || 0,
            carbs: Number(data.totalCarbs) || 0,
            fat: Number(data.totalFat) || 0,
            protein: Number(data.totalProtein) || 0
        };
    }

    return {
        calories: Math.max(100, target.calories - consumed.calories),
        carbs: Math.max(10, target.carbs - consumed.carbs),
        fat: Math.max(5, target.fat - consumed.fat),
        protein: Math.max(10, target.protein - consumed.protein)
    };
  }

  _formatRecipes(hits) {
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
            ingredients: r.ingredientLines || [],
            nutrients: {
                carbs: Math.round(r.totalNutrients.CHOCDF?.quantity || 0),
                protein: Math.round(r.totalNutrients.PROCNT?.quantity || 0),
                fat: Math.round(r.totalNutrients.FAT?.quantity || 0)
            }
        };
    });
  }

  // --- PUBLIC CORE LOGIC ---

  async fetchFromEdamam({ uid, userProfile, query, useQuota, useTime, usePriorityCuisine }) {
    try {
        const params = new URLSearchParams();
        params.append('type', 'public');
        if (query && query.trim() !== '') params.append('q', query);
        
        params.append('app_id', this.appId);
        params.append('app_key', this.appKey);
        
        // Health Labels
        let healthLabels = ['alcohol-free', 'pork-free'];
        if (userProfile.preferences?.allergies) {
            healthLabels = [...healthLabels, ...userProfile.preferences.allergies];
        }
        healthLabels.forEach(label => params.append('health', label));

        if (useTime) {
            this._getMealTypeByTime().forEach(type => params.append('mealType', type));
        }

        let quota = null;
        if (useQuota) {
            quota = await this._calculateRemainingNutrition(uid, userProfile);
            params.append('calories', `0-${Math.round(quota.calories)}`);
            params.append('nutrients[CHOCDF]', Math.round(quota.carbs));
            params.append('nutrients[FAT]', Math.round(quota.fat));
            params.append('nutrients[PROCNT]', Math.round(quota.protein));
        }

        if (usePriorityCuisine) {
            ['South East Asian', 'Asian'].forEach(c => params.append('cuisineType', c));
        }

        params.append('random', 'true');
        ['label', 'image', 'images', 'url', 'ingredientLines', 'calories', 'totalWeight', 'totalTime', 'cuisineType', 'mealType', 'totalNutrients']
          .forEach(field => params.append('field', field));

        const headers = this.userId ? { 'Edamam-Account-User': this.userId } : {};
        const response = await axios.get(`${this.baseUrl}?${params.toString()}`, { headers });
        const recipes = this._formatRecipes(response.data.hits);

        return {
            search_query: query || 'Smart Recommendation',
            remaining_quota: quota,
            count: recipes.length,
            recipes: recipes
        };
    } catch (error) {
        console.error('❌ Edamam Service Error:', error.message);
        return { search_query: query, remaining_quota: null, count: 0, recipes: [] };
    }
  }

  // Wrapper methods
  async getRecommendations(uid, userProfile, foodLabel) {
    return this.fetchFromEdamam({ uid, userProfile, query: foodLabel, useQuota: true, useTime: true, usePriorityCuisine: true });
  }

  async getSmartRecommendations(uid, userProfile) {
    return this.fetchFromEdamam({ uid, userProfile, query: '', useQuota: true, useTime: true, usePriorityCuisine: true });
  }

  async searchRecipes(uid, userProfile, query) {
    return this.fetchFromEdamam({ uid, userProfile, query, useQuota: false, useTime: false, usePriorityCuisine: false });
  }
}

module.exports = new EdamamService();