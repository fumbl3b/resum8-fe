# Resum8 Frontend

A modern, AI-powered resume optimization frontend built with Next.js, React, and TypeScript. This application connects to the [beetune backend](https://github.com/fumbleLabs/beetune) to provide intelligent resume analysis and optimization.

## Features

- **Job Description Analysis**: AI-powered analysis of job postings to extract keywords, requirements, and insights
- **Resume Upload & Processing**: Support for PDF, DOC, DOCX, and TXT files with automatic text extraction
- **Smart Optimization**: Get targeted suggestions to improve resume content based on job requirements
- **LaTeX Generation**: Generate professionally formatted PDF resumes using LaTeX templates
- **Interactive UI**: Modern, responsive interface with real-time feedback and progress tracking

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI with custom components
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Form Handling**: React Hook Form with Zod validation
- **File Upload**: React Dropzone

## Prerequisites

Before running the frontend, ensure you have:

1. Node.js 18 or later installed
2. The [beetune backend](https://github.com/fumbleLabs/beetune) running (default: http://localhost:8000)

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd resum8-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and update the backend URL if needed:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Development

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── analyze/           # Job analysis page
│   ├── generate/          # LaTeX generation page
│   ├── optimize/          # Resume optimization page
│   ├── upload/            # File upload page
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── providers.tsx      # React Query provider
├── components/
│   ├── analysis/          # Job analysis components
│   ├── forms/             # Form components
│   ├── generation/        # LaTeX generation components
│   ├── optimization/      # Resume optimization components
│   └── ui/               # Reusable UI components
├── lib/
│   ├── api.ts            # API client
│   ├── cn.ts             # Utility functions
│   └── types.ts          # TypeScript type definitions
├── stores/
│   └── app-store.ts      # Zustand state management
└── hooks/                # Custom React hooks
```

## API Integration

The frontend communicates with the beetune backend through these endpoints:

- `POST /analyze/job` - Analyze job descriptions
- `POST /resume/extract-text` - Extract text from resume files
- `POST /resume/suggest-improvements` - Get optimization suggestions
- `POST /convert/latex` - Generate LaTeX and PDF output
- `GET /health` - Health check

## User Flow

1. **Upload** - Users upload their resume and paste a job description
2. **Analyze** - AI analyzes the job description to extract keywords and requirements
3. **Optimize** - System compares resume against job requirements and provides suggestions
4. **Generate** - Creates an optimized LaTeX resume with accepted suggestions

## Development Tips

- The app uses server-side rendering where possible for better performance
- State is managed globally with Zustand for simplicity
- All API calls are wrapped with React Query for caching and error handling
- Components follow the compound component pattern for flexibility
- TypeScript is strictly enforced - ensure all types are properly defined

## Building for Production

```bash
npm run build
npm start
```

## Contributing

1. Follow the existing code style and patterns
2. Add TypeScript types for all new features
3. Test the integration with the beetune backend
4. Update this README if you add new features

## License

[Add your license information here]