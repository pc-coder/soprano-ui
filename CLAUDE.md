# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

soprano-ui is an Expo-based React Native application with cross-platform support (iOS, Android, Web). The project uses Expo Router for file-based navigation and React 19 with TypeScript.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (opens menu to choose platform)
npm start

# Platform-specific launches
npm run ios        # iOS simulator
npm run android    # Android emulator
npm run web        # Web browser

# Code quality
npm run lint       # Run ESLint

# Reset project structure (moves starter code to app-example/)
npm run reset-project
```

## Architecture

### Routing & Navigation
- **Expo Router**: File-based routing with typed routes enabled (`experiments.typedRoutes`)
- Root layout: `app/_layout.tsx` - Sets up ThemeProvider and Stack navigator
- Tab navigation: `app/(tabs)/_layout.tsx` - Bottom tabs with haptic feedback
- Modal support: `app/modal.tsx` - Presented as modal via Stack navigator
- Deep linking: Custom URL scheme `sopranoui://`

### Theming System
- Theme definitions: `constants/theme.ts`
- Supports light/dark modes via `@react-navigation/native` ThemeProvider
- Color scheme detection: `hooks/use-color-scheme.ts` (with web variant)
- Platform-aware font configuration with system fonts for iOS and fallbacks for other platforms
- Theme-aware components: `themed-text.tsx`, `themed-view.tsx`

### Component Organization
- **UI components**: `components/ui/` - Reusable UI primitives
  - `icon-symbol.tsx` - Cross-platform icon component (iOS uses SF Symbols via `expo-symbols`, other platforms use `@expo/vector-icons`)
  - `collapsible.tsx` - Animated collapsible component using `react-native-reanimated`
- **Feature components**: `components/` - App-specific components with theming and interaction logic

### TypeScript Configuration
- Path aliases: `@/*` maps to project root for cleaner imports
- Strict mode enabled
- Extends `expo/tsconfig.base`

### Expo Configuration
- **New Architecture**: Enabled (`newArchEnabled: true`)
- **React Compiler**: Enabled (`experiments.reactCompiler`)
- **Web output**: Static site generation
- **Edge-to-edge UI**: Android edge-to-edge enabled
- Auto UI style: Respects system light/dark preference

## Key Technologies
- React Native 0.81.5 with React 19
- Expo SDK ~54
- Reanimated ~4.1 for animations
- Gesture Handler ~2.28 for gestures
- TypeScript ~5.9
