# Real Estate Property Management System

A modern Next.js application for real estate property management with Trestle API integration, advanced search capabilities, and interactive maps.

## 🚀 Features

- **Property Search & Discovery**: Advanced search with semantic capabilities
- **Interactive Maps**: Leaflet-based maps with drawing tools and property visualization
- **User Authentication**: Secure JWT-based authentication system
- **Property Comparison**: Side-by-side property comparison functionality
- **Saved Properties & Searches**: User profile management with favorites
- **Responsive Design**: Mobile-first responsive UI with Tailwind CSS
- **Real-time Updates**: Automatic property data synchronization with Trestle API

## 📋 Prerequisites

Before starting development, ensure you have the following installed:

### Required Software
- **Node.js** (version 18.17 or higher)
- **npm** (comes with Node.js) or **yarn** or **pnpm**
- **Git** for version control

### Required API Keys & Services
- **Trestle API Credentials**: 
  - API ID and Password from CoreLogic Trestle
  - Required for property data integration
- **Google Maps API Key**: 
  - For maps functionality and street view
  - Enable Maps JavaScript API and Street View Static API

### Database
- **SQLite**: Automatically handled by better-sqlite3 (no separate installation required)

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd back
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
# or
pnpm install
```

All required packages are listed in `requirements.txt` and will be installed from `package.json`.

### 3. Environment Configuration

Create a `.env.local` and '.env' file in the root directory and configure the following variables:

```bash
# Trestle API Configuration (Required)
TRESTLE_API_ID=your-trestle-api-id
TRESTLE_API_PASSWORD=your-trestle-api-password
TRESTLE_BASE_URL=https://api-trestle.corelogic.com/trestle
TRESTLE_OAUTH_URL=https://api-trestle.corelogic.com/trestle/oidc/connect/token
TRESTLE_UPDATE_INTERVAL=15

# Database Configuration
DATABASE_URL=./data/users.db

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-make-it-at-least-32-characters-long

# Google Maps (Required for maps functionality)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here

# Application URLs
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=https://api.crowncoastalhomes.com
API_BASE_URL=https://api.crowncoastalhomes.com

# Environment
NODE_ENV=development
```

### 4. Database Setup

The application uses SQLite with better-sqlite3. The database will be automatically created when you first run the application.



To populate the database with sample data: --not necessary--
```bash
node populate-database.js
```

### 5. API Integration Setup ----not necessary--

To test your Trestle API integration:
```bash
node test-trestle-api.js
```

## 🏃‍♂️ Running the Application

### Development Mode
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

The application will start at [http://localhost:3000](http://localhost:3000)

### Production Build
```bash
npm run build
npm run start
```

### Linting
```bash
npm run lint
```

## 📁 Project Structure

```
back/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── api/            # API routes
│   │   ├── auth/           # Authentication pages
│   │   ├── properties/     # Property listing pages
│   │   └── map/            # Map interface
│   ├── components/         # Reusable React components
│   │   ├── ui/            # UI components (buttons, forms, etc.)
│   │   ├── filters/       # Search and filter components
│   │   └── map/           # Map-related components
│   ├── lib/               # Utility libraries
│   │   ├── auth.ts        # Authentication logic
│   │   ├── database.ts    # Database operations
│   │   └── trestle-api.ts # Trestle API integration
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript type definitions
│   └── styles/            # Global styles
├── data/                  # Database files
├── requirements.txt       # Package dependencies list
└── package.json          # Node.js dependencies
```

## 🔧 Development Workflow

### 1. Before Starting Development
- Ensure all environment variables are configured
- Test API connections with provided test scripts
- Run database population script if needed

### 2. Key Development Commands
```bash
# Start development server with turbopack (faster)
npm run dev

# Generate API client (if API changes)
npm run generate-client

# Run database migrations
node run-migration.js

# Test specific features
node test-properties-api.js
node test-semantic-search.js
```

### 3. Testing API Integration
Use the provided test scripts to verify your setup:
- `test-trestle-api.js` - Test Trestle API connection
- `test-oauth-method.js` - Test OAuth authentication
- `test-properties-api.js` - Test property data retrieval

## 🌐 Key Features Setup

### Maps Configuration
- Ensure Google Maps API key is set in environment variables
- Enable required Google Maps APIs in Google Cloud Console

### Property Search
- Semantic search requires vector indexing (automatically handled)
- Property data syncs automatically based on TRESTLE_UPDATE_INTERVAL

### User Authentication
- JWT tokens are used for session management
- User data is stored in SQLite database

## 📚 API Documentation

### Trestle API Integration
The application integrates with CoreLogic's Trestle API for real estate data. Key endpoints:
- Property search and filtering
- Property details and media
- Market statistics

### Internal API Routes
- `/api/properties` - Property search and listing
- `/api/auth` - Authentication endpoints
- `/api/user` - User profile management

## 🚀 Deployment

### Environment Variables for Production
Ensure all environment variables are set in your production environment, especially:
- `JWT_SECRET` (use a strong, unique secret)
- `NODE_ENV=production`
- Valid API keys and credentials

### Build Process
```bash
npm run build
```

## 📖 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Trestle API Documentation](https://docs.trestle.corelogic.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Leaflet Documentation](https://react-leaflet.js.org/)

## 🆘 Troubleshooting

### Common Issues
1. **Trestle API Connection Issues**: Verify your API credentials and check test scripts
2. **Maps Not Loading**: Ensure Google Maps API key is valid and APIs are enabled
3. **Database Errors**: Check file permissions for SQLite database files
4. **Build Errors**: Ensure all dependencies are installed and environment variables are set

### Test Scripts
Use the comprehensive test scripts in the root directory to diagnose issues:
- `debug-trestle-api.js` - Debug Trestle API issues
- `verify-credentials.js` - Verify all API credentials

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly using provided test scripts
5. Submit a pull request

## 📄 License

This project is proprietary. Please contact the development team for licensing information.