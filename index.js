const express = require('express');
const Parser = require('rss-parser');

const parser = new Parser();
const app = express();

// Helper to prevent XML parsing crashes
function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

// Helper to fetch and encode images (for both thumbnail and avatar)
async function fetchImageBase64(url) {
  if (!url) return null;
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    return `data:${contentType};base64,${base64}`;
  } catch (e) {
    return null;
  }
}

app.get('/medium/:username/:slug', async (req, res) => {
  const { username, slug } = req.params;

  try {
    const feed = await parser.parseURL(`https://medium.com/feed/${username}`);
    const article = feed.items.find(item => item.link && item.link.includes(slug));

    if (!article) {
        return res.status(404).send('Article not found.');
    }

    // Extract Date
    const dateObj = new Date(article.pubDate);
    const pubDate = isNaN(dateObj.getTime()) ? 'Recent' : dateObj.toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
    });

    // Extract Thumbnail Image
    const content = article['content:encoded'] || article.content || '';
    const imgMatch = content.match(/<img.*?src=["'](.*?)["']/);
    let base64Image = null;
    if (imgMatch && imgMatch[1]) {
        base64Image = await fetchImageBase64(imgMatch[1]);
    }

    // Extract Author Name & Profile Picture
    const authorName = article.creator || username.replace('@', '');
    const safeAuthorName = escapeXml(authorName);
    
    let avatarBase64 = null;
    if (feed.image && feed.image.url) {
        avatarBase64 = await fetchImageBase64(feed.image.url);
    }

    // Clean text variables
    const maxTitleLen = 90; // Increased allowance for wider box
    const safeTitle = escapeXml(article.title.substring(0, maxTitleLen)) + (article.title.length > maxTitleLen ? '...' : '');

    // Layout Dimensions
    const widgetWidth = 1200;
    const thumbWidth = 260; // 16:9 rectangular ratio
    const thumbHeight = 160;
    const startX = 20;
    const textStartX = startX + thumbWidth + 20; // 300px

    const imageSvg = base64Image 
      ? `<image href="${base64Image}" x="${startX}" y="20" width="${thumbWidth}" height="${thumbHeight}" preserveAspectRatio="xMidYMid slice" clip-path="url(#imageClip)"/>`
      : `<rect x="${startX}" y="20" width="${thumbWidth}" height="${thumbHeight}" fill="#e1e4e8" rx="6"/><text x="${startX + thumbWidth/2}" y="100" font-family="sans-serif" font-size="14" fill="#586069" text-anchor="middle">No Image</text>`;

    const avatarSvg = avatarBase64
      ? `<image href="${avatarBase64}" x="${textStartX}" y="145" width="24" height="24" clip-path="url(#avatarClip)"/>`
      : `<circle cx="${textStartX + 12}" cy="157" r="12" fill="#e1e4e8"/>`;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

    const svg = `
    <svg width="${widgetWidth}" height="190" viewBox="0 0 ${widgetWidth} 190" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>
        .bg { fill: transparent; stroke: #d0d7de; }
        .title { fill: #24292e; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif; font-weight: bold; font-size: 22px; }
        .date { fill: #586069; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif; font-size: 14px; }
        .author { fill: #24292e; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 500; }
        
        @media (prefers-color-scheme: dark) {
          .bg { stroke: #30363d; }
          .title { fill: #c9d1d9; }
          .date { fill: #8b949e; }
          .author { fill: #c9d1d9; }
        }
      </style>
      
      <defs>
        <clipPath id="imageClip">
          <rect x="${startX}" y="20" width="${thumbWidth}" height="${thumbHeight}" rx="6"/>
        </clipPath>
        <clipPath id="avatarClip">
          <circle cx="${textStartX + 12}" cy="157" r="12"/>
        </clipPath>
      </defs>

      <rect class="bg" x="0.5" y="0.5" width="${widgetWidth - 1}" height="189" rx="9.5"/>
      
      ${imageSvg}
      
      <text class="title" x="${textStartX}" y="65">${safeTitle}</text>
      
      <text class="date" x="${textStartX}" y="125">${pubDate}</text>
      
      ${avatarSvg}
      <text class="author" x="${textStartX + 32}" y="162">${safeAuthorName} • Published on Medium</text>
    </svg>`;

    res.status(200).send(svg);
  } catch (error) {
    res.status(500).send('Error fetching feed.');
  }
});

module.exports = app;