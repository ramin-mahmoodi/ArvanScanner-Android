<div align="center">
  <img src="app/src/main/res/mipmap-xxhdpi/ic_launcher.png" width="128" height="128" alt="Logo">
  <h1>🚀 ArvanScanner Android</h1>
  <p><strong>Ultra-lightweight, extremely fast IP scanner for ArvanCloud CDN</strong></p>
</div>

<hr>

## ✨ Features

- ⚡ **Extremely Fast:** Uses direct raw TCP socket connections for maximum performance.
- 🪶 **Ultra Lightweight:** The final APK size is **less than 15 KB**! No bloated frameworks.
- 🎨 **Modern & Responsive UI:** Beautiful Web UI integrated smoothly via Android WebView.
- 🔎 **Advanced Ping Modes:** Supports raw `TCP` ping and precise `TLS` Handshake ping with custom SNI support.
- 🔋 **Battery Efficient:** Pure Java native threads, consuming almost zero resources.
- 📱 **Universal Compatibility:** A single APK runs natively on all CPU architectures (arm32, arm64, x86, x64) without increasing file size.

## 📸 Screenshots

*(You can add screenshots here)*

## 🛠️ Requirements

- Android Studio or Gradle CLI
- Android SDK (API 21 to 34+)

## 🚀 How to Build

Clone the repository and build using Gradle wrapper:

```bash
git clone https://github.com/ramin-mahmoodi/ArvanScanner-Android.git
cd ArvanScanner-Android

# Build Release APK
./gradlew assembleRelease
```

The compiled APK will be generated at:
`app/build/outputs/apk/release/app-release.apk`

---
*Developed with ❤️*
