# Medium Widget API

A serverless API that generates SVG embed widgets for Medium articles with automatic dark mode support.
Get beautiful widgets like this :
<a target="_blank" href="https://medium.com/@mohitdeharkar/vehicle-count-80b15739be12">
  <img src="https://medium-widget-api.vercel.app/medium/@mohitdeharkar/vehicle-count-80b15739be12?v=1" alt="Read Vehicle Count on Medium">
</a>


## How It Works

Provide a Medium username and article slug via the URL route. The API:

- Fetches the user's Medium RSS feed
- Locates the specific article
- Extracts the cover image and profile picture
- Converts images to Base64
- Returns a styled SVG widget

## Usage

### URL Format

```
https://medium-widget-api.vercel.app/medium/@username/article-slug
```

### Embed in Markdown

Use an HTML anchor with image tag:

```html
<a target="_blank" href="https://medium.com/@username/article-slug">
  <img
    src="https://medium-widget-api.vercel.app/medium/@username/article-slug"
    alt="Read Article on Medium"
  />
</a>
```

Or with cache busting parameter:

```html
<a target="_blank" href="https://medium.com/@username/article-slug">
  <img
    src="https://medium-widget-api.vercel.app/medium/@username/article-slug?v=1"
    alt="Read Article on Medium"
  />
</a>
```

Replace `@username` and `article-slug` with your Medium details.

## Features

- Automatic dark mode detection
- Responsive SVG rendering
- Base64 image encoding
- XML character escaping for safety
- Fallback placeholders for missing images
- Response caching (1 hour)

## Status Codes

- `200` - Successfully generated widget
- `404` - Article not found
- `500` - Error fetching feed or generating widget

## Limits

- Works with public Medium feeds
- Respects Medium's RSS feed structure
- Max payload optimized for web display
