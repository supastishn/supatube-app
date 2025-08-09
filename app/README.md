# YouTube-like Frontend (Expo)

This app is a YouTube-style client built with Expo + expo-router that integrates with the provided Express backend.

## Features

- Auth (register/login) using /api/users endpoints.
- JWT stored securely via expo-secure-store and attached to requests.
- Home: list of public videos from /api/videos.
- Video Detail: fetch details /api/videos/:id, stream via /api/videos/:id/stream, like button (/api/videos/:id/like), comments list and posting (/api/videos/:id/comments).
- Search screen using /api/search.

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   # Optionally set your backend URL (defaults: Android emulator 10.0.2.2:3000; iOS/web localhost:3000)
   export EXPO_PUBLIC_API_URL="http://localhost:3000"
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
