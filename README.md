# Sambro Bookmarks

Personal bookmark manager with browser extension and mobile web interface.

## Features

- Save bookmarks with one click from browser extension
- Auto-extract page metadata (title, description, OG image)
- Add personal notes to bookmarks
- Search and filter bookmarks
- Mobile-friendly web interface

## Project Structure

```
sambro-bookmarks/
├── web/                    # React + Vite web app
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── lib/            # Supabase client
│   │   └── App.tsx         # Main app
│   └── package.json
├── extension/              # Chrome extension
│   ├── popup/              # Extension popup UI
│   ├── manifest.json       # Extension manifest
│   └── content.js          # Content script
└── supabase/
    └── schema.sql          # Database schema
```

## Setup

### 1. Supabase Setup

1. Go to [Supabase](https://supabase.com) and create a new project
2. Run the SQL in `supabase/schema.sql` in the SQL Editor
3. Get your Project URL and anon key from Settings > API

### 2. Web App Setup

```bash
cd web
npm install
cp .env.example .env
# Edit .env with your Supabase credentials
npm run dev
```

### 3. Extension Setup

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `extension` folder
4. Update `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `extension/popup/popup.js`

## Deployment

### Web App (Vercel)

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

## Tech Stack

- **Frontend**: React, Vite, TailwindCSS
- **Backend**: Supabase (PostgreSQL)
- **Extension**: Chrome Extension Manifest V3
