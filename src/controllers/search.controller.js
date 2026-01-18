const edamamService = require('../services/edamam.service');
const userService = require('../services/user.service');

// 1. Dashboard Recommendation (Smart)
const getSmartRecommendations = async (req, res) => {
    try {
        const { uid } = req.user;
        const userProfile = await userService.getUserProfile(uid);
        
        if (!userProfile) {
             return res.status(404).json({ status: 'fail', message: 'User profile not found' });
        }

        const result = await edamamService.getSmartRecommendations(uid, userProfile);

        res.status(200).json({
            status: 'success',
            message: 'Smart recommendations fetched',
            data: result
        });
    } catch (error) {
        console.error('Smart Rec Error:', error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};

// 2. Manual Search (Query)
const searchRecipes = async (req, res) => {
    try {
        const { uid } = req.user;
        const { q } = req.query; // Ambil ?q=seblak

        if (!q) {
            return res.status(400).json({ status: 'fail', message: 'Query param (q) is required' });
        }

        const userProfile = await userService.getUserProfile(uid);
        // Note: Kalau profile belum ada, kita tetap bisa search (anggap tanpa alergi tambahan)
        const safeProfile = userProfile || { preferences: { allergies: [] } };

        const result = await edamamService.searchRecipes(uid, safeProfile, q);

        res.status(200).json({
            status: 'success',
            message: 'Search results fetched',
            data: result
        });
    } catch (error) {
        console.error('Search Error:', error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};

module.exports = { getSmartRecommendations, searchRecipes };