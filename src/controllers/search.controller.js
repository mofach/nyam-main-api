const edamamService = require('../services/edamam.service');
const userService = require('../services/user.service');

class SearchController {
  constructor(edamam, user) {
    this.edamamService = edamam;
    this.userService = user;
  }

  // 1. Dashboard Recommendation (Smart)
  getSmartRecommendations = async (req, res) => {
    try {
      const { uid } = req.user;
      const userProfile = await this.userService.getUserProfile(uid);
      
      if (!userProfile) {
        return res.status(404).json({ status: 'fail', message: 'User profile not found' });
      }

      const result = await this.edamamService.getSmartRecommendations(uid, userProfile);

      res.status(200).json({
        status: 'success',
        message: 'Smart recommendations fetched',
        data: result
      });
    } catch (error) {
      console.error('Smart Rec Error:', error);
      res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
  }

  // 2. Manual Search (Query)
  searchRecipes = async (req, res) => {
    try {
      const { uid } = req.user;
      const { q } = req.query;

      if (!q) {
        return res.status(400).json({ status: 'fail', message: 'Query param (q) is required' });
      }

      const userProfile = await this.userService.getUserProfile(uid);
      // Fallback profile jika user belum onboarding
      const safeProfile = userProfile || { preferences: { allergies: [] } };

      const result = await this.edamamService.searchRecipes(uid, safeProfile, q);

      res.status(200).json({
        status: 'success',
        message: 'Search results fetched',
        data: result
      });
    } catch (error) {
      console.error('Search Error:', error);
      res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
  }
}

module.exports = new SearchController(edamamService, userService);