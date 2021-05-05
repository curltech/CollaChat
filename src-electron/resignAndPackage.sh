#!/bin/bash

# Name of your app.
APP="Colla"
# The path of your app to sign.
APP_PATH="../dist/electron/Packaged/mas/$APP.app"
# The path to the location you want to put the signed package.
RESULT_PATH="../dist/electron/Packaged/mas/$APP.pkg"
# The name of certificates you requested.
APP_KEY="3rd Party Mac Developer Application: CURL TECH PTE. LTD. (6T8MC3433B)"
INSTALLER_KEY="3rd Party Mac Developer Installer: CURL TECH PTE. LTD. (6T8MC3433B)"
# The path of your plist files.
PARENT_PLIST="entitlements.mas.plist"
CHILD_PLIST="entitlements.mas.inherit.plist"
LOGINHELPER_PLIST="entitlements.mas.loginhelper.plist"
FRAMEWORKS_PATH="$APP_PATH/Contents/Frameworks"

codesign --options runtime --timestamp -s "$APP_KEY" -f --entitlements "$CHILD_PLIST" "$FRAMEWORKS_PATH/Electron Framework.framework/Versions/A/Electron Framework"
codesign --options runtime --timestamp -s "$APP_KEY" -f --entitlements "$CHILD_PLIST" "$FRAMEWORKS_PATH/Electron Framework.framework/Versions/A/Libraries/libffmpeg.dylib"
codesign --options runtime --timestamp -s "$APP_KEY" -f --entitlements "$CHILD_PLIST" "$FRAMEWORKS_PATH/Electron Framework.framework/Libraries/libffmpeg.dylib"
codesign --options runtime --timestamp -s "$APP_KEY" -f --entitlements "$CHILD_PLIST" "$FRAMEWORKS_PATH/Electron Framework.framework"
codesign --options runtime --timestamp -s "$APP_KEY" -f --entitlements "$CHILD_PLIST" "$FRAMEWORKS_PATH/$APP Helper.app/Contents/MacOS/$APP Helper"
codesign --options runtime --timestamp -s "$APP_KEY" -f --entitlements "$CHILD_PLIST" "$FRAMEWORKS_PATH/$APP Helper.app/"
codesign --options runtime --timestamp -s "$APP_KEY" -f --entitlements "$LOGINHELPER_PLIST" "$APP_PATH/Contents/Library/LoginItems/$APP Login Helper.app/Contents/MacOS/$APP Login Helper"
codesign --options runtime --timestamp -s "$APP_KEY" -f --entitlements "$LOGINHELPER_PLIST" "$APP_PATH/Contents/Library/LoginItems/$APP Login Helper.app/"
codesign --options runtime --timestamp -s "$APP_KEY" -f --entitlements "$CHILD_PLIST" "$APP_PATH/Contents/MacOS/$APP"
codesign --options runtime --timestamp -s "$APP_KEY" -f --entitlements "$PARENT_PLIST" "$APP_PATH"

productbuild --component "$APP_PATH" /Applications --sign "$INSTALLER_KEY" "$RESULT_PATH"