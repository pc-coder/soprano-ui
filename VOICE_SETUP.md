# Soprano Voice Pipeline Setup

## Overview
The voice pipeline uses:
- **OpenAI Whisper** for Speech-to-Text
- **Anthropic Claude** for LLM responses
- **ElevenLabs** for Text-to-Speech

## Setup Instructions

### 1. Get API Keys

#### OpenAI API Key
1. Sign up at [https://platform.openai.com/](https://platform.openai.com/)
2. Go to API Keys section
3. Create a new API key
4. Copy the key

#### Anthropic API Key
1. Sign up at [https://console.anthropic.com/](https://console.anthropic.com/)
2. Go to API Keys section
3. Create a new API key
4. Copy the key

#### ElevenLabs API Key & Voice ID
1. Sign up at [https://elevenlabs.io/](https://elevenlabs.io/)
2. Go to Profile Settings → API Keys
3. Generate an API key
4. Go to Voice Lab to get a Voice ID (or use a default one)
5. Copy both the API key and Voice ID

### 2. Configure Environment Variables

1. Copy the example env file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your API keys:
   ```env
   EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
   EXPO_PUBLIC_ANTHROPIC_API_KEY=your_anthropic_api_key_here
   EXPO_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
   EXPO_PUBLIC_ELEVENLABS_VOICE_ID=your_voice_id_here
   ```

3. **IMPORTANT**: Never commit the `.env` file to git (it's already in .gitignore)

### 3. Install Dependencies

Dependencies are already installed if you ran `npm install`. If not:
```bash
npm install
```

### 4. Test the Voice Pipeline

1. Start the Expo development server:
   ```bash
   npm start
   ```

2. Open the app on your device or simulator

3. Look for the Soprano mic button (floating button on the right side)

4. Test the pipeline:
   - **Tap once** → Starts listening (mic button turns red with pulsing animation)
   - **Tap again** → Stops recording and processes:
     - Transcribes audio with OpenAI Whisper
     - Gets LLM response from Anthropic (with screen context)
     - Synthesizes speech with ElevenLabs
     - Plays audio response
   - **During processing** → Button shows loading animation (yellow)
   - **During playback** → Button shows speaker icon (green)

## Voice States

- **Idle** (Blue): Ready to start listening
- **Listening** (Red + Pulse): Recording audio
- **Processing** (Yellow + Spin): Transcribing and getting LLM response
- **Speaking** (Green): Playing audio response
- **Error** (Red): Something went wrong

## Screen Context Integration

The voice assistant is context-aware! It knows:
- Current screen you're viewing
- Screen data (balance, transactions, etc.)
- Form state (if filling out a form)
- Recent actions

Example interactions:
- "What's my balance?" → Soprano knows you're on Dashboard and can see your balance
- "Help me fill this form" → Soprano sees the UPI payment form and can guide you
- "What transactions do I have?" → Soprano can reference your recent transactions

## Troubleshooting

### No Audio Recording
- Check microphone permissions
- iOS: Settings → Privacy → Microphone → Allow access
- Android: Grant microphone permission when prompted

### API Errors
- Check console logs for detailed error messages
- Verify API keys are correct in `.env`
- Ensure you have credits/quota on each service

### Audio Not Playing
- Check device volume
- Ensure silent mode is off (iOS)
- Check console for playback errors

## Console Logs

The voice pipeline logs all steps to the console:
```
[VoicePipeline] Starting recording...
[VoicePipeline] Recording started
[VoicePipeline] Stopping recording...
[VoiceService] Transcribing audio with OpenAI Whisper...
[VoiceService] Transcription: "What's my balance?"
[VoiceService] Getting LLM response from Anthropic...
[VoiceService] LLM response: "Your current balance is ₹45,230..."
[VoiceService] Synthesizing speech with ElevenLabs...
[VoiceService] Audio saved to: file://...
[VoiceService] Playing audio...
[VoiceService] Audio playback complete
[VoicePipeline] Pipeline complete
```

## Notes

- Voice pipeline requires network connection
- First request may be slower (cold start)
- Audio files are automatically cleaned up
- Works on iOS, Android, and Web (with microphone access)
