# VoltBuilder Upload Checklist

## Pre-Upload Verification

- [ ] Project built successfully (`npm run build:prod`)
- [ ] Capacitor synced (`npx cap sync ios`)
- [ ] `capacitor.config.json` exists and is current
- [ ] `dist/` folder contains built web assets
- [ ] iOS project structure is intact
- [ ] App icons and splash screens are in place

## Required Files Present

- [ ] `package.json`
- [ ] `capacitor.config.json`
- [ ] `ionic.config.json`
- [ ] `tsconfig.json`
- [ ] `dist/index.html`
- [ ] `ios/App/App.xcodeproj/project.pbxproj`

## VoltBuilder Configuration

- [ ] VoltBuilder account set up
- [ ] iOS certificates uploaded to VoltBuilder
- [ ] Provisioning profiles configured
- [ ] Bundle ID matches certificates
- [ ] App Store Connect app created (if needed)

## Upload Process

1. Create ZIP archive of entire project directory
2. Upload to VoltBuilder dashboard
3. Configure build settings
4. Start build process
5. Monitor build logs
6. Download IPA file when complete

## Post-Build

- [ ] Test IPA on device/simulator
- [ ] Verify all features work correctly
- [ ] Upload to App Store Connect (if ready)

Generated: Wed 13 Aug 2025 06:40:57 PM CDT
