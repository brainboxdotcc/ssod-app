![Artwork](https://github.com/brainboxdotcc/ssod/blob/main/resource/app_encyclopaedia.jpg)

# The Seven Spells Of Destruction

The Seven Spells Of Destruction is a multiplayer open world role playing game originally created in 1993. This repository contains the web and mobile application frontend for the game, built using React, Vite and Capacitor. The application communicates with the Seven Spells game server over WebSockets.

The game is also available through Discord, using the [Seven Spells bot](https://github.com/brainboxdotcc/ssod).

This game has quite a long history.

### Timeline of the game's development

* **1993**: This game was created by me at age 13 as a 1480 paragraph novel, similar in inspiration to "[Fighting Fantasy](https://en.wikipedia.org/wiki/Fighting_Fantasy)" books by Steve Jackson and Ian Livingstone.
* **1996**: The game book was typed up into [inter-word](https://en.wikipedia.org/wiki/Wordwise#InterWord) on BBC Master 128 Computer.
* **2000**: The game book content was transcribed into Microsoft Word 98.
* **2001**: Word 98 content converted to a web based game, completely single player. C++ backend.
* **2003**: Multiplayer features added to the game. [ssod.org](https://ssod.org) domain name registered. Peak player count in 2005 was 1500 concurrent players.
* **2014**: Start of development of a 3D single player Seven Spells game in Unreal Engine 4.
* **2020**: Unreal Engine 4 game abandoned due to lack of resources to adapt the content to a fully open 3D world.
* **2023**: New parser/engine created for the 2004 game content to run via Discord through a bot.
* **2026**: Development of a standalone web and mobile frontend using React and Capacitor.

## Software Dependencies

* Node.js
* npm
* Android Studio and Android SDK (for Android builds)
* Xcode on macOS (for iOS builds)

## Configuring the application

Create a `.env` file in the project root containing the WebSocket endpoint for the Seven Spells server:

```env
VITE_GAME_WS_URL=wss://ws.ssod.org/api/game
```

For local development, this can instead point to a locally running game server.

## Starting the application

Install dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

## Building the application

To build the production web frontend:

```bash
npm run build
```

The generated files are placed in the `dist` directory and can be served by a standard web server.

### Android

```bash
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```

The debug APK is generated in `android/app/build/outputs/apk/debug/` and is automatically signed for testing.

### iOS

On macOS with Xcode installed:

```bash
npm run build
npx cap sync ios
npx cap open ios
```

The application can then be built using Xcode.

## GitHub Actions

GitHub Actions automatically builds the Android and iOS applications.

The Android workflow produces a signed debug APK suitable for sideloading and an unsigned release APK. The iOS workflow produces an unsigned simulator build.

Set the repository variable `VITE_GAME_WS_URL` to the WebSocket endpoint to be embedded in the application during the build.
