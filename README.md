# Gurrai

React Native app for Android and iOS, built with Expo and Expo Router.
The application source, assets, tests, and native build configuration are in this directory.

## Run

Install dependencies from this directory (`mobile/`):

```sh
pnpm install --frozen-lockfile
```

Configure `EXPO_PUBLIC_API_URL` in `.env` using `.env.example`, pointing to your separately hosted Gurrai API. Login and customer data require that API; no backend is included in this repository.

```sh
pnpm start
```

## Verify

```sh
pnpm typecheck
pnpm lint
pnpm test
```

Build profiles for Android and iOS are in `eas.json`.

