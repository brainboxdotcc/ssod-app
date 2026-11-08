# Seven Spells mobile CI

The workflow builds an unsigned Android release APK and an unsigned iOS Simulator `.app` on each push to `main`, or on manual dispatch. **The iOS Simulator `.app` is not an IPA and cannot be installed on an ordinary iPhone.** It is a compilation check, not a distribution package.

The Android signing step is optional and runs only if all four repository secrets exist: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`. The signed APK is uploaded as an Actions artefact. The unsigned release APK is not directly installable until signed. Never commit the keystore or signing passwords.

The iOS workflow currently deliberately skips distribution signing and upload, even when Apple credentials exist. The `IOS_*` variables are reserved for a later signed archive/IPA workflow once an Apple Developer account, certificate, profile and App Store Connect credentials are available. This avoids implying that an unsigned iPhone IPA can be generated.

The Capacitor app identifier is initially `org.ssod.sevenspells`; confirm it before first store registration. Native Android/iOS projects are generated during CI and are not committed. For later native customisations, commit the generated platform directories and change the workflow to sync rather than add them each time.

The workflow uses `npm install` because the source archive did not include a package-lock.json. Once dependencies have been resolved locally, commit the generated lockfile and switch to `npm ci` for reproducible builds.

This package does not publish to either store: that requires the corresponding developer account and release credentials. Avoid enabling pull-request triggers on signing workflows. The webapp still needs its production WebSocket URL and mobile WebView behaviour tested before distribution.
