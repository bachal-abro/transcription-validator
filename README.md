# Transcription Validator

A crowdsourced transcription validation system for Pakistani languages (Pashto, Urdu, etc.) built with Next.js 14, Tailwind CSS, and Supabase.

## Features

- 🎵 **Audio Batch Uploader**: Upload .wav and .mp3 files to Supabase Storage
- 📊 **Smart CSV Importer**: Import transcriptions with BLEU and chrF++ metrics
- 🔊 **Persistent Audio Player**: Sticky HTML5 player with playback controls
- 📝 **Side-by-Side Comparison**: Compare transcriptions from different AI models
- ✅ **Voting System**: Vote for the more accurate transcription
- 💬 **Feedback Collection**: Collect user comments on transcription quality
- 🌐 **RTL Support**: Full right-to-left text support for Pakistani languages

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Styling**: Tailwind CSS + Shadcn UI
- **Fonts**: Noto Sans Arabic, Noto Nastaliq Urdu
- **Icons**: Lucide React
- **CSV Parsing**: PapaParse

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### 1. Clone and Install

```bash
cd "Transcription Validator"
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the schema from `supabase/schema.sql`
3. Go to **Storage** and create a bucket named `audio-files` with public access
4. Go to **Settings > API** and copy your credentials

### 3. Configure Environment

Create a `.env.local` file with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── audio/[id]/       # Get audio with transcriptions
│   │   ├── feedback/         # Submit validation feedback
│   │   ├── import-csv/       # Import transcriptions from CSV
│   │   └── upload/           # Upload audio files
│   ├── admin/                # Admin dashboard
│   ├── validate/[id]/        # Validation interface
│   └── page.tsx              # Home page (gallery)
├── components/
│   ├── ui/                   # Shadcn UI components
│   ├── audio-dropzone.tsx    # Audio file uploader
│   ├── audio-gallery.tsx     # Audio file gallery
│   ├── audio-player.tsx      # Sticky audio player
│   ├── csv-importer.tsx      # CSV import component
│   ├── feedback-form.tsx     # Feedback submission form
│   └── transcription-card.tsx # Transcription display card
├── lib/
│   └── supabase/             # Supabase client
└── types/
    └── database.ts           # TypeScript types
```

## Database Schema

### Tables

- **audios**: Audio file metadata and storage URLs
- **models**: AI transcription models (Peshawar, Whisper)
- **transcriptions**: Transcription text with metrics
- **feedback**: User votes and comments

### CSV Import Format

Your CSV file should have these columns:

| Column | Description |
|--------|-------------|
| `audio_name` | Filename (must match uploaded audio) |
| `transcription_pesh` | Peshawar model transcription |
| `transcription` | Whisper model transcription |
| `BLEU` | BLEU score (optional) |
| `chrF++` | chrF++ score (optional) |

## RTL Support

The application includes full RTL support for Pakistani languages:

- Text direction is set to `rtl` on transcription containers
- Increased line-height to prevent Arabic character overlap
- Noto Sans Arabic and Noto Nastaliq Urdu fonts loaded
- Custom Tailwind utilities for RTL typography

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload` | POST | Upload audio files |
| `/api/upload` | GET | List all audio files |
| `/api/import-csv` | POST | Import transcriptions from CSV |
| `/api/audio/[id]` | GET | Get audio with transcriptions |
| `/api/feedback` | POST | Submit validation feedback |
| `/api/feedback` | GET | Get feedback (optional audioId filter) |

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository on [Vercel](https://vercel.com)
3. Add environment variables in project settings
4. Deploy!

### Other Platforms

Build the production version:

```bash
npm run build
npm start
```

## License

MIT License - feel free to use this for your research projects.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
