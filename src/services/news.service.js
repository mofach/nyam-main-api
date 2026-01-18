const Parser = require('rss-parser');

const parser = new Parser();

// DAFTAR SUMBER BERITA (Urutan Prioritas)
// Jika yang pertama mati, otomatis pindah ke yang kedua, dst.
const RSS_SOURCES = [
    { 
        name: 'Suara.com Health', 
        url: 'https://www.suara.com/rss/health' 
    },
    { 
        name: 'CNN Indonesia Gaya Hidup', 
        url: 'https://www.cnnindonesia.com/gaya-hidup/rss' 
    },
    { 
        name: 'Antara News Kesehatan', 
        url: 'https://megapolitan.antaranews.com/rss/kesehatan.xml' 
    },
    {
        name: 'Republika Health',
        url: 'https://www.republika.co.id/rss/health' // Cadangan terakhir
    }
];

const getHealthNews = async () => {
    // Loop semua sumber sampai nemu yang berhasil
    for (const source of RSS_SOURCES) {
        try {
            console.log(`Trying RSS Source: ${source.name}...`);
            
            // Set timeout biar gak nunggu kelamaan (5 detik)
            const feed = await parser.parseURL(source.url);
            
            if (!feed.items || feed.items.length === 0) {
                throw new Error('Feed kosong');
            }

            // Ambil 10 berita terbaru & Format
            const articles = feed.items.slice(0, 10).map(item => ({
                source: source.name,
                title: item.title,
                link: item.link, 
                pubDate: item.pubDate,
                snippet: item.contentSnippet || item.content || 'Klik untuk baca selengkapnya.', 
                thumbnail: item.enclosure?.url || item.image?.url || null 
            }));

            console.log(`✅ Success fetching from ${source.name}`);
            return articles;

        } catch (error) {
            console.warn(`⚠️ Gagal mengambil dari ${source.name}: ${error.message}`);
            // Lanjut ke loop berikutnya (sumber cadangan)
        }
    }

    // Kalau semua gagal
    throw new Error('Semua sumber berita sedang gangguan. Silakan coba lagi nanti.');
};

module.exports = { getHealthNews };