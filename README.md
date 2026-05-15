# 🛒 Market App

A minimal, dark-themed grocery list app built with React Native & Expo. Add items in natural language, get AI-powered store navigation hints, and never forget where the pasta is again.

## Features

- **Smart item parsing** — type `2kg elma`, `elma 2 kg`, or `3 şişe süt` and the app extracts name, quantity, and unit automatically (no AI, pure regex)
- **AI store hints** — tap the ℹ️ button on any item to ask Gemini which aisle it's in, what's nearby, and get a shopping tip
- **Response caching** — Gemini is only called once per item; subsequent taps show cached results instantly with a badge indicator
- **Check off & delete** — mark items as done or remove them with a swipe

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React Native + Expo SDK 54 |
| Navigation | Expo Router |
| State | Zustand |
| AI | Google Gemini 2.5 Flash |
| Icons | @expo/vector-icons (Ionicons) |
| Language | TypeScript |

## Getting Started

### 1. Clone & install

```bash
git clone https://github.com/emrehancetin/market-app.git
cd market-app
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and add your [Google AI Studio](https://aistudio.google.com) API key:

```
EXPO_PUBLIC_GEMINI_API_KEY=your_key_here
```

### 3. Start the dev server

```bash
npx expo start --clear
```

Scan the QR code with [Expo Go](https://expo.dev/go) on your phone.

## Project Structure

```
market-app/
├── app/
│   ├── _layout.tsx          # Tab navigation
│   └── (tabs)/
│       ├── index.tsx        # Main list screen
│       └── history.tsx      # Saved lists (coming soon)
├── src/
│   ├── stores/
│   │   └── listStore.ts     # Zustand store
│   └── types/
│       └── index.ts         # ListItem, ShoppingList, ProductInfo
└── .env.example
```

## Roadmap

- [ ] List history — save, browse, and clone past lists
- [ ] Voice input — speak items instead of typing
- [ ] Supabase sync — offline-first with cloud backup
- [ ] Category auto-detection — AI assigns aisle category on add
