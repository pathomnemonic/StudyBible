// Fails the iOS build early if the Xcode project, the Capacitor config and the store assets disagree.
//   npx tsx scripts/ios/check.ts
import { existsSync, readFileSync } from 'node:fs';

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url).pathname, 'utf8');
const problems: string[] = [];
const cfg = /appId:\s*'([^']+)'/.exec(read('capacitor.config.ts'))?.[1];
const ids = [...read('ios/App/App.xcodeproj/project.pbxproj').matchAll(/PRODUCT_BUNDLE_IDENTIFIER = ([^;]+);/g)].map((m) => m[1].trim());
if (!cfg) problems.push('capacitor.config.ts has no appId');
if (!ids.length || ids.some((i) => i !== cfg)) problems.push(`bundle id mismatch: capacitor.config.ts says ${cfg}, the Xcode project says ${ids.join(', ')}`);
const yaml = read('codemagic.yaml');
if (!new RegExp(`bundle_identifier:\\s*${cfg?.replace(/\./g, '\\.')}\\s*$`, 'm').test(yaml)) problems.push(`codemagic.yaml bundle_identifier is not ${cfg}`);
const plist = read('ios/App/App/Info.plist');
if (!/ITSAppUsesNonExemptEncryption<\/key>\s*<false\/>/.test(plist)) problems.push('Info.plist is missing ITSAppUsesNonExemptEncryption=false (the app only uses Apple’s built-in HTTPS)');
const icon = new URL('../../ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png', import.meta.url).pathname;
if (!existsSync(icon)) problems.push('the 1024 app icon is missing');
else { const d = readFileSync(icon); const w = d.readUInt32BE(16), h = d.readUInt32BE(20), colour = d[25]; if (w !== 1024 || h !== 1024) problems.push(`app icon is ${w}x${h}, must be 1024x1024`); if (colour === 6 || colour === 4) problems.push('app icon has an alpha channel; App Store Connect rejects it'); }
if (problems.length) { console.error('iOS check failed:\n - ' + problems.join('\n - ')); process.exit(1); }
console.log(`iOS check passed (bundle id ${cfg}).`);
