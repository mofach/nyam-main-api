const Parser = require('rss-parser');

class NewsService {
  constructor() {
    this.parser = new Parser();
    // DAFTAR SUMBER BERITA (Urutan Prioritas)
    this.rssSources = [
      { name: 'Suara.com Health', url: 'https://www.suara.com/rss/health' },
      { name: 'CNN Indonesia Gaya Hidup', url: 'https://www.cnnindonesia.com/gaya-hidup/rss' },
      { name: 'Antara News Kesehatan', url: 'https://megapolitan.antaranews.com/rss/kesehatan.xml' },
      { name: 'Republika Health', url: 'https://www.republika.co.id/rss/health' }
    ];
  }

  async getHealthNews() {
    for (const source of this.rssSources) {
      try {
        console.log(`Trying RSS Source: ${source.name}...`);
        
        // Parsing URL RSS
        const feed = await this.parser.parseURL(source.url);
        
        if (!feed.items || feed.items.length === 0) {
          throw new Error('Feed kosong');
        }

        // Ambil 10 berita terbaru & Format menggunakan private helper
        const articles = feed.items.slice(0, 10).map(item => this._formatArticle(item, source.name));

        console.log(`✅ Success fetching from ${source.name}`);
        return articles;

      } catch (error) {
        console.warn(`⚠️ Gagal mengambil dari ${source.name}: ${error.message}`);
        // Loop akan berlanjut ke sumber berikutnya secara otomatis
      }
    }

    throw new Error('Semua sumber berita sedang gangguan. Silakan coba lagi nanti.');
  }

  // Private helper untuk memformat objek artikel
  _formatArticle(item, sourceName) {
    return {
      source: sourceName,
      title: item.title,
      link: item.link, 
      pubDate: item.pubDate,
      snippet: item.contentSnippet || item.content || 'Klik untuk baca selengkapnya.', 
      thumbnail: item.enclosure?.url || item.image?.url || null 
    };
  }
}

module.exports = new NewsService();