#!/bin/bash

SOURCE="mobile-native/assets/bootsplash/newlogo.png"
ANDROID_RES="mobile-native/android/app/src/main/res"
IOS_ASSETS="mobile-native/ios/MobileNativeApp/Images.xcassets/AppIcon.appiconset"

if [ ! -f "$SOURCE" ]; then
    echo "Source image not found at $SOURCE"
    exit 1
fi

echo "Generating Icons from $SOURCE..."

# Android
sips -z 48 48   "$SOURCE" --out "$ANDROID_RES/mipmap-mdpi/ic_launcher.png"
sips -z 48 48   "$SOURCE" --out "$ANDROID_RES/mipmap-mdpi/ic_launcher_round.png"

sips -z 72 72   "$SOURCE" --out "$ANDROID_RES/mipmap-hdpi/ic_launcher.png"
sips -z 72 72   "$SOURCE" --out "$ANDROID_RES/mipmap-hdpi/ic_launcher_round.png"

sips -z 96 96   "$SOURCE" --out "$ANDROID_RES/mipmap-xhdpi/ic_launcher.png"
sips -z 96 96   "$SOURCE" --out "$ANDROID_RES/mipmap-xhdpi/ic_launcher_round.png"

sips -z 144 144 "$SOURCE" --out "$ANDROID_RES/mipmap-xxhdpi/ic_launcher.png"
sips -z 144 144 "$SOURCE" --out "$ANDROID_RES/mipmap-xxhdpi/ic_launcher_round.png"

sips -z 192 192 "$SOURCE" --out "$ANDROID_RES/mipmap-xxxhdpi/ic_launcher.png"
sips -z 192 192 "$SOURCE" --out "$ANDROID_RES/mipmap-xxxhdpi/ic_launcher_round.png"

echo "Android icons updated."

# iOS
sips -z 20 20     "$SOURCE" --out "$IOS_ASSETS/icon-20@1x.png"
sips -z 40 40     "$SOURCE" --out "$IOS_ASSETS/icon-20@2x.png"
sips -z 60 60     "$SOURCE" --out "$IOS_ASSETS/icon-20@3x.png"

sips -z 29 29     "$SOURCE" --out "$IOS_ASSETS/icon-29@1x.png"
sips -z 58 58     "$SOURCE" --out "$IOS_ASSETS/icon-29@2x.png"
sips -z 87 87     "$SOURCE" --out "$IOS_ASSETS/icon-29@3x.png"

sips -z 40 40     "$SOURCE" --out "$IOS_ASSETS/icon-40@1x.png"
sips -z 80 80     "$SOURCE" --out "$IOS_ASSETS/icon-40@2x.png"
sips -z 120 120   "$SOURCE" --out "$IOS_ASSETS/icon-40@3x.png"

sips -z 50 50     "$SOURCE" --out "$IOS_ASSETS/icon-50@1x.png"
sips -z 100 100   "$SOURCE" --out "$IOS_ASSETS/icon-50@2x.png"

sips -z 57 57     "$SOURCE" --out "$IOS_ASSETS/icon-57@1x.png"
sips -z 114 114   "$SOURCE" --out "$IOS_ASSETS/icon-57@2x.png"

sips -z 120 120   "$SOURCE" --out "$IOS_ASSETS/icon-60@2x.png"
sips -z 180 180   "$SOURCE" --out "$IOS_ASSETS/icon-60@3x.png"

sips -z 72 72     "$SOURCE" --out "$IOS_ASSETS/icon-72@1x.png"
sips -z 144 144   "$SOURCE" --out "$IOS_ASSETS/icon-72@2x.png"

sips -z 76 76     "$SOURCE" --out "$IOS_ASSETS/icon-76@1x.png"
sips -z 152 152   "$SOURCE" --out "$IOS_ASSETS/icon-76@2x.png"

sips -z 167 167   "$SOURCE" --out "$IOS_ASSETS/icon-83.5@2x.png"

sips -z 1024 1024 "$SOURCE" --out "$IOS_ASSETS/icon-1024@1x.png"

echo "iOS icons updated."
