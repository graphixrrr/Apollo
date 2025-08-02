# Apollo AI Replica

A powerful AI-powered web scraping application that finds people's contact information, including phone numbers, emails, and more. Built with Next.js, TypeScript, and advanced web scraping capabilities.

## Features

- 🔍 **Smart Search**: Search for people by name, company, title, or any combination
- 📞 **Phone Number Detection**: Advanced regex patterns to extract phone numbers from web pages
- 📧 **Email Extraction**: Find email addresses across multiple sources
- 🏢 **Company Information**: Extract company details and job titles
- 📊 **Confidence Scoring**: AI-powered confidence scoring for found contacts
- 💾 **Database Storage**: Persistent storage with Prisma ORM
- 🎨 **Modern UI**: Beautiful, responsive interface inspired by Apollo
- ⚡ **Real-time Status**: Live progress tracking for scraping jobs

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite with Prisma ORM
- **Web Scraping**: Puppeteer, Cheerio, Axios
- **Package Manager**: pnpm

## Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd apollo-ai-replica
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```

4. **Initialize the database**
   ```bash
   pnpm db:generate
   pnpm db:push
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Web Interface

1. **Search for Contacts**
   - Enter a search query (e.g., "John Smith CEO", "Marketing Director Apple")
   - Click "Search" to start the scraping process
   - View real-time progress and results

2. **View Results**
   - Browse discovered contacts with confidence scores
   - Click on email/phone links to contact directly
   - Export or save contacts for later use

### Command Line Scraper

Use the standalone scraper script for testing:

```bash
# Search for a specific person
pnpm scrape "John Smith CEO"

# Search for a company role
pnpm scrape "Software Engineer Google"

# Search for a title
pnpm scrape "Marketing Director"
```

## API Endpoints

### Scrape Contacts
```http
POST /api/scrape
Content-Type: application/json

{
  "query": "John Smith CEO",
  "maxResults": 50
}
```

### Get Contacts
```http
GET /api/contacts?q=john&company=apple&hasEmail=true
```

### Get Scraping Jobs
```http
GET /api/scrape?jobId=job_id_here
```

## Database Schema

### Contact Model
```typescript
{
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  company?: string
  title?: string
  linkedinUrl?: string
  website?: string
  location?: string
  industry?: string
  notes?: string
  tags: string[]
  source: string
  confidence: number
  createdAt: Date
  updatedAt: Date
}
```

## Web Scraping Features

### Phone Number Detection
The scraper uses multiple regex patterns to detect phone numbers:
- US/Canada format: `(123) 456-7890`
- International format: `+1-123-456-7890`
- Simple format: `123-456-7890`
- Extension format: `123-456-7890 x123`

### Email Extraction
- Standard email pattern matching
- Duplicate removal
- Validation checks

### Name Extraction
- Full name patterns
- Middle initial support
- Company name detection

## Configuration

### Environment Variables
```env
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_APP_NAME="Apollo AI Replica"
NEXT_PUBLIC_APP_DESCRIPTION="Find people and their contact information"
```

### Scraping Settings
- Maximum results per search: 50 (configurable)
- Search timeout: 30 seconds per page
- User agent rotation to avoid blocking
- Rate limiting to respect websites

## Development

### Available Scripts

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema to database
pnpm db:studio        # Open Prisma Studio

# Scraping
pnpm scrape           # Run standalone scraper

# Linting
pnpm lint             # Run ESLint
```

### Project Structure
```
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/         # React components
├── lib/               # Utility libraries
│   ├── database.ts    # Database client
│   ├── scraper.ts     # Web scraping engine
│   └── types.ts       # TypeScript types
├── prisma/            # Database schema
├── scripts/           # Standalone scripts
└── public/            # Static assets
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Legal Notice

This application is for educational purposes only. Please ensure you comply with:
- Website terms of service
- Robots.txt files
- Rate limiting policies
- Data protection regulations

## License

MIT License - see LICENSE file for details

## Support

For questions or issues:
1. Check the documentation
2. Search existing issues
3. Create a new issue with details

---

**Note**: This is a replica/educational project. For production use, consider using official APIs and data sources. 