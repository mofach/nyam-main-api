const newsService = require('../services/news.service');

const getNews = async (req, res) => {
    try {
        const articles = await newsService.getHealthNews();
        
        res.status(200).json({
            status: 'success',
            message: 'Health news fetched successfully',
            data: articles
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

module.exports = { getNews };