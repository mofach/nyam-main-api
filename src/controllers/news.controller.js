const newsService = require('../services/news.service');

class NewsController {
  constructor(service) {
    this.service = service;
  }

  getNews = async (req, res) => {
    try {
      const articles = await this.service.getHealthNews();
      
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
  }
}

module.exports = new NewsController(newsService);