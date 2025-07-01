# Brainiac - AI-Powered Document Analysis
built with [bolt](https://bolt.new)

A sophisticated React Native app built with Expo that provides AI-powered document analysis with cross-device synchronization using Supabase.

## Features

### 🧠 **AI Analysis**
- **Multiple AI Providers**: Support for DeepSeek AI and Google Gemini 2.5 Flash
- **Comprehensive Analysis**: Executive summaries, key insights, recommendations, and technical details
- **Code Examples**: Real, implementable code snippets with syntax highlighting
- **Performance Metrics**: Industry benchmarks and optimization recommendations
- **Architecture Diagrams**: Visual process flows and system architectures

### 🔐 **Authentication & Sync**
- **Secure Authentication**: Email/password authentication with Supabase
- **Cross-Device Sync**: All analyses and settings sync across devices
- **Profile Management**: User profiles with customizable settings
- **Data Security**: Row-level security with encrypted API key storage

### 📱 **Modern UI/UX**
- **Material Design 3**: Beautiful, production-ready interface
- **Dark/Light Themes**: Automatic theme switching based on system preferences
- **Responsive Design**: Optimized for mobile, tablet, and web
- **Smooth Animations**: Micro-interactions and transitions

### 📄 **Document Support**
- **Multiple Formats**: PDF, TXT, and Markdown file support
- **File Upload**: Drag-and-drop or browse file selection
- **Content Preview**: Document preview before analysis
- **History Management**: Complete analysis history with search and filtering

## Tech Stack

- **Frontend**: React Native with Expo Router
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **AI Integration**: DeepSeek AI & Google Gemini APIs
- **Styling**: Custom Material Design 3 components
- **Icons**: Lucide React Native
- **Fonts**: Inter font family via Expo Google Fonts

## Setup Instructions

### 1. Prerequisites
- Node.js 18+ and npm/yarn
- Expo CLI (`npm install -g @expo/cli`)
- Supabase account

### 2. Supabase Setup

1. **Create a new Supabase project** at [supabase.com](https://supabase.com)

2. **Run the database schema**:
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `sql/schema.sql`
   - Execute the SQL to create all tables, policies, and functions

3. **Configure Storage**:
   - Go to Storage in your Supabase dashboard
   - The `documents` bucket will be created automatically by the schema
   - Verify the bucket exists and has the correct policies

4. **Get your credentials**:
   - Go to Settings > API
   - Copy your Project URL and anon public key

### 3. Environment Setup

1. **Copy environment file**:
   ```bash
   cp .env.example .env
   ```

2. **Configure environment variables**:
   ```env
   # Supabase Configuration
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # AI API Keys (optional - can be configured in-app)
   EXPO_PUBLIC_DEEPSEEK_API_KEY=your_deepseek_api_key
   EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
   ```

### 4. Installation & Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Open the app**:
   - Scan QR code with Expo Go app (iOS/Android)
   - Press `w` to open in web browser
   - Press `i` for iOS simulator
   - Press `a` for Android emulator

## AI Provider Setup

### DeepSeek AI
1. Visit [platform.deepseek.com](https://platform.deepseek.com)
2. Create an account and navigate to API Keys
3. Generate a new API key
4. Add to app settings or environment variables

### Google Gemini
1. Visit [aistudio.google.com](https://aistudio.google.com/app/apikey)
2. Create an account and generate an API key
3. Add to app settings or environment variables

## Database Schema

The app uses the following main tables:

- **profiles**: User profile information
- **documents**: Uploaded document metadata and content
- **analyses**: AI analysis results and metadata
- **user_settings**: User preferences and API configurations

All tables have Row Level Security (RLS) enabled to ensure users can only access their own data.

## Features Overview

### Authentication Flow
- Sign up with email/password
- Email verification (optional)
- Automatic profile creation
- Secure session management

### Document Analysis Workflow
1. **Upload**: Select PDF, TXT, or MD files
2. **Preview**: Review document content
3. **Analyze**: Choose AI provider and start analysis
4. **Results**: View comprehensive analysis with multiple tabs
5. **Save**: Automatically sync to cloud for cross-device access

### Analysis Features
- **Executive Summary**: High-level overview
- **Key Insights**: Detailed analytical insights
- **Recommendations**: Actionable recommendations
- **Technical Details**: Code examples and architecture diagrams
- **Full Report**: Comprehensive markdown-formatted analysis

## Deployment

### Web Deployment
```bash
npm run build:web
```

### Mobile App Store
1. Configure app.json for production
2. Build with EAS Build
3. Submit to App Store/Play Store

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support, please open an issue on GitHub or contact the development team.
