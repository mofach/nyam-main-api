const Parser = require('rss-parser');

const parser = new Parser();
// Sumber: Antara News (Kategori Kesehatan) - Stabil & Gratis
const RSS_URL = 'https://www.antaranews.com/rss/kesehatan';

const getHealthNews = async () => {
    try {
        const feed = await parser.parseURL(RSS_URL);
        
        // Ambil 10 berita terbaru & Format biar rapi di JSON
        const articles = feed.items.slice(0, 10).map(item => ({
            title: item.title,
            link: item.link, // Android buka ini di WebView
            pubDate: item.pubDate,
            snippet: item.contentSnippet, 
            thumbnail: item.enclosure?.url || null // Gambar thumbnail (kalau ada)
        }));

        return articles;

    } catch (error) {
        console.error('RSS Parser Error:', error);
        throw new Error('Gagal mengambil data berita.');
    }
};

module.exports = { getHealthNews };