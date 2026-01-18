const trackerService = require('../services/tracker.service');

// 1. Simpan Makanan
const addMeal = async (req, res) => {
  try {
    const { uid } = req.user; // Dari Middleware Token
    const mealData = req.body;

    // Validasi sederhana
    if (!mealData.foodName || mealData.calories === undefined) {
      return res.status(400).json({ status: 'fail', message: 'Food name and calories are required' });
    }

    const updatedLog = await trackerService.addMealLog(uid, mealData);

    res.status(200).json({
      status: 'success',
      message: 'Meal logged successfully',
      data: updatedLog
    });

  } catch (error) {
    console.error('Add Meal Error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// 2. Ambil Progress (Home Screen)
const getTodayLog = async (req, res) => {
  try {
    const { uid } = req.user;
    const { date } = req.query; // Bisa request tanggal spesifik ?date=2024-01-01

    const log = await trackerService.getDailyLog(uid, date);

    if (!log) {
        // Jika belum ada log hari ini, return null data (Front end set progress 0)
        return res.status(200).json({
            status: 'success',
            message: 'No logs found for this date',
            data: null 
        });
    }

    res.status(200).json({
      status: 'success',
      data: log
    });

  } catch (error) {
    console.error('Get Log Error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

module.exports = { addMeal, getTodayLog };