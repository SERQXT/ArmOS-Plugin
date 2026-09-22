---
name: sign-macos-app
tier: t1
description: "Sign and notarize a macOS file (.app, .command, .sh, or any executable) for distribution outside the App Store. Triggers on 'sign this app', 'notarize this script', 'get rid of the quarantine warning', 'sign for mac distribution', 'codesign', 'notarize'."
kind: atom
status: stable
visibility: anyone
created_by: alexmdengate
created_at: "2026-07-16T00:00:00Z"
---

# Sign & Notarize macOS App

Sign a macOS file with a Developer ID certificate and submit it to Apple's notarization service so Gatekeeper trusts it on download.

## Prerequisites

- macOS with Xcode Command Line Tools (`xcode-select --install`)
- Apple Developer account with a **Developer ID Application** certificate installed in Keychain
- An app-specific password from [appleid.apple.com](https://appleid.apple.com) → App-Specific Passwords

## Known values (Alex's account)

- **Apple ID:** alexmdengate@gmail.com
- **Team ID:** 6GWTL3S75V
- **Signing identity:** `Developer ID Application: ALEX MICHAEL DENGATE (6GWTL3S75V)`
- **Intermediate CA:** Already installed (Developer ID G2)
- **App-specific password:** ask Alex — stored in their password manager

## Step 1 — Verify signing identity is present

```bash
security find-identity -v -p codesigning
```

Expected: `Developer ID Application: ALEX MICHAEL DENGATE (6GWTL3S75V)`

If missing, install the cert + intermediate CA:
```bash
# Install intermediate CA
curl -sO https://www.apple.com/certificateauthority/DeveloperIDG2CA.cer
security import DeveloperIDG2CA.cer -k ~/Library/Keychains/login.keychain-db

# Install Developer ID cert (download from developer.apple.com first)
security import ~/Downloads/developerID_application.cer -k ~/Library/Keychains/login.keychain-db

# Install private key (only needed if setting up on a new machine with the exported key)
security import ~/developer_id.key -k ~/Library/Keychains/login.keychain-db -T /usr/bin/codesign
```

## Step 2 — Wrap shell scripts in an .app bundle

Apple's notarization service requires a signed binary or bundle — bare `.command`/`.sh` files are rejected. Wrap them first:

```bash
mkdir -p /tmp/MyInstaller.app/Contents/MacOS

# Launcher script that opens Terminal and runs the real script
cat > /tmp/MyInstaller.app/Contents/MacOS/MyInstaller << 'EOF'
#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
open -a Terminal "$DIR/install.sh"
EOF
chmod +x /tmp/MyInstaller.app/Contents/MacOS/MyInstaller

# Copy the actual install script
cp /path/to/your/install.sh /tmp/MyInstaller.app/Contents/MacOS/install.sh
chmod +x /tmp/MyInstaller.app/Contents/MacOS/install.sh

# Info.plist (replace com.yourcompany.appname and bundle name)
cat > /tmp/MyInstaller.app/Contents/Info.plist << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleIdentifier</key>
    <string>com.yourcompany.appname</string>
    <key>CFBundleName</key>
    <string>MyInstaller</string>
    <key>CFBundleExecutable</key>
    <string>MyInstaller</string>
    <key>CFBundleVersion</key>
    <string>1.0</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
</dict>
</plist>
PLIST
```

Skip this step if the target is already an `.app` bundle.

## Step 3 — Sign

```bash
codesign --sign "Developer ID Application: ALEX MICHAEL DENGATE (6GWTL3S75V)" \
    --options runtime \
    --deep \
    --force \
    /tmp/MyInstaller.app
```

Verify:
```bash
codesign --verify --verbose /tmp/MyInstaller.app
```

Expected: `valid on disk` + `satisfies its Designated Requirement`

## Step 4 — Package for notarization

Zip from the **parent directory** of the .app to avoid path prefixes in the archive:

```bash
cd /tmp && rm -f MyInstaller.zip && zip -r MyInstaller.zip MyInstaller.app
unzip -l MyInstaller.zip | head -3  # should start with "MyInstaller.app/", not "tmp/MyInstaller.app/"
```

## Step 5 — Notarize

```bash
xcrun notarytool submit /tmp/MyInstaller.zip \
    --apple-id "alexmdengate@gmail.com" \
    --team-id "6GWTL3S75V" \
    --password "YOUR_APP_SPECIFIC_PASSWORD" \
    --wait
```

Expected: `status: Accepted`. If `Invalid`, fetch the log:
```bash
xcrun notarytool log <submission-id> \
    --apple-id "alexmdengate@gmail.com" \
    --team-id "6GWTL3S75V" \
    --password "YOUR_APP_SPECIFIC_PASSWORD"
```

Common rejection causes:
- **"No signed executables or bundles"** — bare script submitted without .app wrapper (go back to Step 2)
- **Missing entitlements** — re-sign with an entitlements file

## Step 6 — Staple (optional but preferred)

Stapling embeds the notarization ticket so Gatekeeper works offline. Requires direct access to Apple's CloudKit — will fail on Netskope/VPN:

```bash
xcrun stapler staple /tmp/MyInstaller.app
```

If this fails due to corporate network SSL inspection, skip it. Gatekeeper will do an online check instead — same end result for users with internet.

## Step 7 — Package for distribution

```bash
cd /tmp && rm -f MyInstaller-signed.zip && zip -r MyInstaller-signed.zip MyInstaller.app
```

Give users this zip. They unzip → double-click the `.app` → Terminal opens and runs the installer. No quarantine warning.

## Notes

- **Why zip?** macOS strips code signatures from `.app` bundles downloaded as bare files. The zip preserves extended attributes and the signature.
- **Stapling vs online check:** Stapling is preferred for air-gapped environments. For internet-connected users, skipping stapling is fine.
- **New machine setup:** Export the private key from Keychain on the original machine and re-import on the new one. The Developer ID cert can be re-downloaded from developer.apple.com.
