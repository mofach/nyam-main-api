const trackerService = require('../services/tracker.service');

class TrackerController {
  constructor(service) {
    this.service = service;
  }

  addMeal = async (req, res) => {
    try {
      const { uid } = req.user;
      const mealData = req.body;

      if (!mealData.foodName || mealData.calories === undefined) {
        return res.status(400).json({ status: 'fail', message: 'Food name and calories are required' });
      }

      const updatedLog = await this.service.addMealLog(uid, mealData);

      res.status(200).json({
        status: 'success',
        message: 'Meal logged successfully',
        data: updatedLog
      });
    } catch (error) {
      console.error('Add Meal Error:', error);
      res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
  }

  getTodayLog = async (req, res) => {
    try {
      const { uid } = req.user;
      const { date } = req.query;

      const log = await this.service.getDailyLog(uid, date);

      if (!log) {
        return res.status(200).json({
          status: 'success',
          message: 'No logs found for this date',
          data: null 
        });
      }

      res.status(200).json({ status: 'success', data: log });
    } catch (error) {
      console.error('Get Log Error:', error);
      res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
  }
}

module.exports = new TrackerController(trackerService);