# Soprano UI 🎙️

A voice-first banking application with AI-powered guided navigation, built with React Native and Expo. Soprano UI provides an intuitive voice interface for financial transactions, with support for both online and offline AI models.

## 🌟 Overview

Soprano UI reimagines mobile banking with a voice-first approach, featuring an AI assistant that guides users through complex financial tasks in Hindi. The application supports UPI payments, loan applications, and account management - all accessible through natural voice interactions.

## ✨ Features

### 🎤 Voice Interface
- **Multi-modal Voice Assistant**: Tap for free conversation, long-press for guided form filling
- **Draggable Avatar**: Move the AI assistant anywhere on screen
- **Real-time Status Indicators**: Visual feedback for listening, processing, and speaking states
- **Animated Avatar**: Professional 3D robot animation that changes speed based on status

### 🗣️ Multilingual Support
- **Hindi-First Guided Mode**: All guided navigation in Hindi for better accessibility
- **Automatic Language Detection**: Whisper STT detects user's language
- **Language-Specific Voices**: Different ElevenLabs voices for English and Hindi
- **Code-Switching Support**: Handles Hinglish and mixed language input

### 📋 Guided Form Filling
- **Voice-Driven Forms**: Complete UPI payments and loan applications entirely by voice
- **Field Clarifications**: Ask questions about form fields and get concise Hindi explanations
- **Document Scanning**: Scan Aadhaar cards and PAN cards for auto-fill
- **Visual Guidance**: Highlights active fields during guided mode
- **Smart Validation**: Real-time validation with voice feedback

### 💸 Financial Features
- **UPI Payments**: Send money with voice commands
- **Loan Applications**: Apply for loans with guided voice assistance
- **Transaction History**: View past transactions
- **Payment Failure Handling**: Proactive voice reassurance for failed transactions
- **Account Management**: View balance and account details

### 🎯 User Experience
- **PIN Authentication**: Secure 4-digit PIN login
- **Voice Captions**: Optional text display of AI responses
- **Offline Support**: Choose between online and offline AI providers
- **Haptic Feedback**: Touch feedback for better interaction
- **Dark/Light Mode**: Automatic theme switching

### ⚙️ AI Provider Configuration
Users can choose between online and offline providers for:
- **STT (Speech-to-Text)**: OpenAI Whisper | Expo Speech (offline)
- **LLM (Language Model)**: Claude | Qwen (offline)
- **TTS (Text-to-Speech)**: ElevenLabs | Expo Speech (offline)
- **OCR (Document Scanning)**: Claude Vision | SmolVLM (offline)

## 🛠️ Tech Stack

### Frontend Framework
- **React Native** (0.81.5) with **React 19**
- **Expo SDK** (~54) with New Architecture enabled
- **TypeScript** (~5.9) with strict mode
- **Expo Router** for file-based navigation

### UI & Animation
- **React Native Reanimated** (~4.1) - High-performance animations
- **React Native Gesture Handler** (~2.28) - Gesture recognition
- **Lottie** - Professional animated avatar
- **Expo Symbols** - iOS SF Symbols support

### AI & Voice Services
- **OpenAI Whisper API** - Speech-to-Text with language detection
- **Anthropic Claude API** - Language model for conversation
- **ElevenLabs API** - Text-to-Speech with multilingual voices
- **Expo Speech** - Offline fallback for TTS/STT

### State Management & Context
- **React Context API** - Global state management
- Custom contexts for:
  - Voice state and status
  - Guided form navigation
  - Settings and provider configuration
  - Authentication
  - Screen and form data

### Development Tools
- **ESLint** - Code linting
- **Expo Dev Client** - Custom development builds
- **Git** - Version control

## 📁 Project Structure

```
soprano-ui/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Soprano.tsx      # Draggable voice assistant avatar
│   │   ├── SpeechCaption.tsx # Voice output captions
│   │   ├── Button.tsx       # Themed button component
│   │   └── ...
│   ├── screens/             # Screen components
│   │   ├── PINLoginScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── UPIPaymentScreen.tsx
│   │   ├── LoanApplicationScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── context/             # React Context providers
│   │   ├── VoiceContext.tsx
│   │   ├── GuidedFormContext.tsx
│   │   ├── SettingsContext.tsx
│   │   └── AuthContext.tsx
│   ├── hooks/               # Custom React hooks
│   │   ├── useVoicePipeline.ts
│   │   └── useFormController.ts
│   ├── services/            # External API services
│   │   ├── voiceService.ts  # STT/TTS integrations
│   │   ├── llmService.ts    # Claude API
│   │   └── documentScanService.ts
│   ├── utils/               # Utility functions
│   │   ├── conversationFlow.ts
│   │   ├── languageMapping.ts
│   │   └── contextSerializer.ts
│   ├── config/              # Configuration files
│   │   ├── api.ts           # API keys and endpoints
│   │   └── formFieldDefinitions.ts
│   ├── theme/               # Design system
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   └── spacing.ts
│   └── navigation/          # Navigation configuration
│       └── AppNavigator.tsx
├── assets/                  # Static assets
│   └── animations/          # Lottie animations
└── app/                     # Expo Router app directory
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/soprano-ui.git
   cd soprano-ui
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy `.env.example` to `.env` and add your API keys:
   ```bash
   cp .env.example .env
   ```

   Required API keys:
   ```env
   # OpenAI (for Whisper STT)
   EXPO_PUBLIC_OPENAI_API_KEY=your_openai_key

   # Anthropic (for Claude LLM)
   EXPO_PUBLIC_ANTHROPIC_API_KEY=your_anthropic_key

   # ElevenLabs (for TTS)
   EXPO_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_key
   EXPO_PUBLIC_ELEVENLABS_VOICE_ID=default_voice_id
   EXPO_PUBLIC_ELEVENLABS_VOICE_ID_ENGLISH=english_voice_id
   EXPO_PUBLIC_ELEVENLABS_VOICE_ID_HINDI=hindi_voice_id
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on your platform**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Press `w` for web browser
   - Scan QR code with Expo Go app

## 🔐 Default Credentials

- **PIN**: `1234`

## 🎮 Usage

### Voice Interactions
1. **Tap the robot avatar** - Start free conversation mode
2. **Long-press the robot avatar** - Start guided form filling mode
3. **Drag the avatar** - Move it anywhere on screen

### Test Scenarios
- **UPI Payment**: Send money to any UPI ID
- **Failed Payment**: Send to `user@newbank` to trigger failure flow
- **Loan Application**: Apply with voice-guided steps in Hindi
- **Document Scanning**: Say "scan" during address/PAN fields

### Settings Configuration
Navigate to **Profile → AI Service Providers** to switch between:
- Online (cloud-based) providers
- Offline (on-device) providers

## 🏗️ Architecture

### Voice Pipeline Flow
1. **STT**: Audio → Text (Whisper API with language detection)
2. **LLM**: Text → AI Response (Claude with guided mode prompts)
3. **TTS**: Text → Audio (ElevenLabs with language-specific voices)

### Guided Mode System
- Form field definitions with Hindi prompts
- Clarification support with metadata
- Real-time validation
- Visual highlighting of active fields
- Automatic progression through form steps

### Context Serialization
The system maintains rich context including:
- Current screen and form state
- User input history
- Field metadata for clarifications
- Guided mode progress

## 🌍 Internationalization

- **Primary Language**: Hindi (guided mode)
- **Supported Languages**: English, Hindi, Hinglish (free conversation)
- **Voice Output**: Language-specific voices via ElevenLabs
- **Automatic Detection**: Whisper detects spoken language

## 🔧 Development

### Key Commands
```bash
npm start          # Start dev server
npm run ios        # Run on iOS
npm run android    # Run on Android
npm run web        # Run on web
npm run lint       # Run ESLint
```

### Environment Setup
- Ensure audio permissions are granted on device/simulator
- For iOS: Run in Simulator (Expo Go may have limitations)
- For Android: Enable microphone permissions

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ using Claude Code**
