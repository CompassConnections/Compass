#!/bin/bash
#
# Pre-flight for an App Store build: proves the binary we are about to ship does not declare that it
# tracks anyone.
#
# This exists because of the guideline 5.1.2(i) rejection of 1.42.0. The label in App Store Connect
# was clean and our own code tracks nobody, but `@capgo/capacitor-social-login` 7.14.9 hard-depended on
# FBSDKCoreKit, which ships a privacy manifest declaring `NSPrivacyTracking: true`, the tracking
# domain `ep1.facebook.com`, and Device ID with `tracking = true`. Xcode aggregates every manifest in
# the binary into the app's privacy report, so a linked-but-never-initialised Facebook SDK made the
# *app* declare tracking. Nothing in the source would have shown that; only the pods do.
#
# So the check is deliberately about the *aggregate*, not about Facebook. Any future dependency that
# drags in a tracking SDK trips it too.
#
# Runs on the CI mac after `pod install` and before `fastlane beta`, because Apple burns the build
# number on receipt of an upload rather than on acceptance: failing here costs nothing, failing at
# review costs a version bump and a review cycle.

set -euo pipefail
cd "$(dirname "$0")/.."

fail=0
note() { printf '  %s\n' "$*"; }
bad() { printf '  ✗ %s\n' "$*"; fail=1; }
ok() { printf '  ✓ %s\n' "$*"; }

echo "=============================================="
echo " iOS privacy pre-flight"
echo "=============================================="

echo
echo "[1/5] Plugin podspec — did the providers config apply?"
PODSPEC=node_modules/@capgo/capacitor-social-login/CapgoCapacitorSocialLogin.podspec
if [ ! -f "$PODSPEC" ]; then
  bad "$PODSPEC not found — run yarn install"
elif grep -q "^ *s.dependency 'FBSDK" "$PODSPEC"; then
  bad "podspec still declares FBSDK. \`plugins.SocialLogin.providers.facebook: false\` in"
  note "  capacitor.config.ts did not take effect. Three things have to hold, in order:"
  note "    1. plugin >= 7.20            (installed: $(node -p "require('./node_modules/@capgo/capacitor-social-login/package.json').version" 2>/dev/null || echo '?'))"
  note "    2. a \`cap sync\` run *after* the config change — the hook is \`capacitor:sync:before\`,"
  note "       so a bare \`pod install\` will not rewrite the podspec on its own"
  note "    3. that sync ran the project's OWN CLI. This is the one that bit us: \`npx cap\`"
  note "       resolves to the copy nested under @capacitor/assets, which is Capacitor 5 and has"
  note "       no \`runHooks\` at all — it never walks plugins looking for the hook, so the sync"
  note "       succeeds and silently does nothing. Use ./scripts/cap.sh, not \`npx cap\`."
  grep -n "s.dependency" "$PODSPEC" | sed 's/^/      /'
else
  ok "no FBSDK dependency"
  grep -n "s.dependency" "$PODSPEC" | sed 's/^/      /'
fi

echo
echo "[2/5] Podfile.lock — is any Facebook pod resolved?"
if [ ! -f ios/App/Podfile.lock ]; then
  bad "ios/App/Podfile.lock not found — run pod install first"
elif grep -q 'FBSDK\|FBAEMKit' ios/App/Podfile.lock; then
  bad "Facebook pods are still resolved:"
  grep -n 'FBSDK\|FBAEMKit' ios/App/Podfile.lock | sed 's/^/      /'
else
  ok "no FBSDK / FBAEMKit pods"
fi

echo
echo "[3/5] Aggregate privacy manifests — does anything linked declare tracking?"
python3 - <<'PY' || fail=1
import glob, plistlib, sys, os

paths = sorted(set(glob.glob('ios/App/Pods/**/PrivacyInfo.xcprivacy', recursive=True)))
app = 'ios/App/App/PrivacyInfo.xcprivacy'
if os.path.exists(app):
    paths.append(app)

if not paths:
    print('  ✗ no privacy manifests found at all — did pod install run?')
    sys.exit(1)

# One framework ships the same manifest per slice (arm64, simulator, catalyst); collapse them so the
# log lists each dependency once rather than three times.
seen, offenders, domains = {}, [], set()
for p in paths:
    try:
        d = plistlib.load(open(p, 'rb'))
    except Exception as e:
        print(f'  ✗ {p}: unreadable ({e})')
        sys.exit(1)
    name = p.split('/')[3] if p.startswith('ios/App/Pods/') else 'App (our own)'
    tracking = bool(d.get('NSPrivacyTracking', False))
    doms = list(d.get('NSPrivacyTrackingDomains', []) or [])
    prev = seen.get(name)
    seen[name] = (tracking or (prev[0] if prev else False), sorted(set(doms) | set(prev[1] if prev else [])))

for name, (tracking, doms) in sorted(seen.items()):
    mark = '✗' if (tracking or doms) else '·'
    extra = f'  domains={doms}' if doms else ''
    print(f'  {mark} {name:34} tracking={str(tracking):5}{extra}')
    if tracking or doms:
        offenders.append(name)
        domains |= set(doms)

print(f'\n  {len(seen)} manifests, {len(offenders)} declaring tracking')
if offenders:
    print(f'  ✗ tracking declared by: {", ".join(offenders)}')
    if domains:
        print(f'  ✗ tracking domains in the binary: {sorted(domains)}')
    print('\n  A linked SDK that declares tracking makes the APP declare tracking, however little of')
    print('  it runs. Either remove the dependency, or implement AppTrackingTransparency and say so')
    print('  in App Store Connect. Our own manifest saying false does not override it.')
    sys.exit(1)
print('  ✓ nothing in the binary declares tracking')
PY

echo
echo "[4/5] Our own manifest"
python3 - <<'PY' || fail=1
import plistlib, sys, os
p = 'ios/App/App/PrivacyInfo.xcprivacy'
if not os.path.exists(p):
    print(f'  ✗ {p} is missing'); sys.exit(1)
try:
    d = plistlib.load(open(p, 'rb'))
except Exception as e:
    print(f'  ✗ {p} is not a valid plist: {e}'); sys.exit(1)
t, doms = d.get('NSPrivacyTracking'), d.get('NSPrivacyTrackingDomains')
if t is not False:
    print(f'  ✗ NSPrivacyTracking is {t!r}, expected false'); sys.exit(1)
if doms != []:
    print(f'  ✗ NSPrivacyTrackingDomains is {doms!r}, expected an empty array'); sys.exit(1)
print('  ✓ valid plist, NSPrivacyTracking=false, no tracking domains')
PY

echo
echo "[5/5] Is our manifest actually in the bundle?"
# A manifest that is not in Copy Bundle Resources ships nowhere and proves nothing.
if grep -q 'PrivacyInfo.xcprivacy in Resources' ios/App/App.xcodeproj/project.pbxproj; then
  ok "PrivacyInfo.xcprivacy is in the Resources build phase"
else
  bad "PrivacyInfo.xcprivacy is NOT in the Resources build phase — it will not ship"
fi

echo
echo "=============================================="
if [ "$fail" -ne 0 ]; then
  echo " FAILED — not uploading. See above."
  echo "=============================================="
  exit 1
fi
echo " PASSED — nothing in this build declares tracking."
echo "=============================================="
