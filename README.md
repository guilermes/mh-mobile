# 📦 Marketplace Helper Mobile

**The mobile companion app for Marketplace Helper, a tool for online marketplace sellers. It brings a listings dashboard and a shipping-cost simulator to your phone.**

The shipping simulator is the core of the app: take a photo of a product box, read its weight from a connected scale, and get an estimated freight price based on **cubic weight**, the same rule carriers use to bill shipments.

Built with **React Native, Expo and TypeScript** as the Integrative Project of the 4th semester of the Multiplatform Software Development program at **FATEC Votorantim**.

> 🚧 **Status: MVP in development.** The app structure, navigation, authentication flow, theming and the freight calculation are implemented. Photo measurement, scale connection and the login API are still simulated. See [Project Status](#-project-status) for details.

<!-- Add screenshots or a short GIF here (Login, Home, Shipping simulator, dark mode), e.g.:
<p align="center">
  <img src="./docs/home.png" width="240" />
  <img src="./docs/simulator.png" width="240" />
  <img src="./docs/dark-mode.png" width="240" />
</p>
-->

<!-- Add a link to the Marketplace Helper web app repository here -->

---

## ✨ Features

- **Shipping simulator:** capture the box with the camera, register its weight from a scale, and see the four measurements (height, width, depth, weight) on gauges, followed by the estimated freight.
- **Cubic-weight freight calculation:** the price is based on the larger of the real weight and the volumetric weight.
- **Home dashboard:** KPIs for active and paused listings, average freight and marketplace cost, plus a table of recent freight changes with color-coded increases and decreases.
- **Authentication flow:** protected routes, with the session stored securely on the device and restored when the app opens.
- **Light and dark themes:** switchable in Settings, with the preference saved on the device.
- **Custom bottom navigation:** five tabs, with the shipping simulator highlighted at the center.

---

## 🚦 Project Status

| Area | Status |
| --- | --- |
| Navigation, protected routes, session persistence | ✅ Implemented |
| Light/dark theme with saved preference | ✅ Implemented |
| Design system (tokens, reusable components) | ✅ Implemented |
| Camera capture in the shipping simulator | ✅ Implemented |
| Cubic-weight freight calculation | ✅ Implemented (sample tariff) |
| Home dashboard | 🟡 UI complete, using sample data |
| Login | 🟡 UI and flow complete, API call is mocked |
| Measuring the box from a photo | 🟡 Mocked, returns fixed dimensions |
| Scale connection | 🟡 Mocked, returns a fixed weight |
| Listings (Anúncios) and Insights tabs | 🔜 Placeholder screens |

The mocked parts live behind small service functions (see [Architecture](#-architecture)), so each one can be replaced with the real integration without touching the UI.

---

## 🏗️ Architecture

```
src/
├── app/              # Expo Router (file-based routing)
│   ├── (auth)/       # Login, only reachable when signed out
│   └── (tabs)/       # Home, Listings, Shipping simulator, Insights, Settings
├── screens/          # Screen components
├── components/       # BottomTabBar, MeasureGauge, KpiCard, FreightEstimateCard...
├── auth/             # AuthContext: sign in/out and session restore
├── context/          # ThemeContext: light/dark scheme
├── constants/        # theme.ts: design tokens
└── services/         # Integration points
    ├── measurements.ts   # box dimensions from a photo
    ├── scale.ts          # weight from the scale
    └── freight.ts        # cubic-weight freight calculation
```

**Key decisions**

- **Guarded navigation:** Expo Router's `Stack.Protected` shows the tabs only to signed-in users and the login only to signed-out users, so there is no manual redirect logic.
- **Service layer for integrations:** measurement, scale and freight logic are isolated from the UI. Each mocked service documents its expected contract with a `TODO`, which makes swapping in the real implementation straightforward.
- **Design tokens:** colors, spacing, radii and typography come from a single `theme.ts` derived from the project's `design.md` (minimalist style, navy primary color, Inter font), including a derived dark palette.
- **Secure session storage:** the auth token is kept with `expo-secure-store`, with a graceful fallback on web, where it isn't available.

### How the freight is estimated

```
volume          = height × width × depth              (cm³)
cubic weight    = volume ÷ 6000                       (kg)
billable weight = max(real weight, cubic weight)      (kg)
price           = base fee + billable weight × rate per kg
```

The divisor (6000 is the usual value in Brazil) and the fee values are defined in `freight.ts`. The current rates are **sample values** and will be replaced by real carrier or marketplace tariffs.

---

## 🧰 Tech Stack

| Category | Technologies |
| --- | --- |
| **Framework** | React Native, Expo, React 19 |
| **Language** | TypeScript |
| **Navigation** | Expo Router (typed routes), React Navigation |
| **Device APIs** | `expo-image-picker` (camera), `expo-secure-store` |
| **UI** | Custom design system, Inter font (`@expo-google-fonts/inter`), Reanimated |
| **Tooling** | React Compiler enabled, ESLint |

---

## ⚙️ Running Locally

**Prerequisites:** [Node.js](https://nodejs.org/) and npm, plus the [Expo Go](https://expo.dev/go) app on your phone or an Android/iOS emulator.

1. Clone the repository:
   ```bash
   git clone https://github.com/guilermes/mh-mobile.git
   cd mh-mobile/mh-mobile
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Start the app:
   ```bash
   npx expo start
   ```
4. Scan the QR code with Expo Go, or press `a` (Android) or `i` (iOS) to open an emulator.

**Trying the app:** since the login is mocked, any e-mail containing an `@` and any non-empty password will sign you in. In the shipping simulator, the camera needs a real device or an emulator with camera support, and the measurements and weight returned afterwards are example values.

---

## 🗺️ Roadmap

- Connect the login to the real Marketplace Helper API.
- Measure the box from the photo (computer vision or a reference object in the image).
- Read the weight from a physical scale over Bluetooth or Wi-Fi.
- Replace the sample tariff with real carrier and marketplace rates.
- Build the Listings and Insights screens and connect the Home dashboard to real data.

---

## 👤 Author

**Guilherme Nobrega**
Full Stack developer and Software Development (Multiplatform) student at FATEC Votorantim, Brazil.

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?logo=linkedin&logoColor=white)](https://www.linkedin.com/in/guilherme-nobrega-0a5104104/)
[![GitHub](https://img.shields.io/badge/GitHub-guilermes-181717?logo=github&logoColor=white)](https://github.com/guilermes)
