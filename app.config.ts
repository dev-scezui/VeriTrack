import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: "VeriTrack",
    slug: "VeriTrack",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
        image: "./assets/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#ffffff"
    },
    ios: {
        supportsTablet: true,
        infoPlist: {
            UIBackgroundModes: [
                "location",
                "fetch"
            ],
            NSLocationAlwaysAndWhenInUseUsageDescription: "This app needs your location to track your stops automatically.",
            NSLocationAlwaysUsageDescription: "This app needs your location to track your stops automatically.",
            NSLocationWhenInUseUsageDescription: "This app needs your location to track your stops automatically."
        }
    },
    android: {
        adaptiveIcon: {
            foregroundImage: "./assets/adaptive-icon.png",
            backgroundColor: "#ffffff"
        },
        permissions: [
            "ACCESS_BACKGROUND_LOCATION",
            "ACCESS_FINE_LOCATION",
            "ACCESS_COARSE_LOCATION",
            "FOREGROUND_SERVICE"
        ],
        edgeToEdgeEnabled: true,
        predictiveBackGestureEnabled: false,
        package: "com.scezui.veritrack",
        config: {
            googleMaps: {
                apiKey: process.env.GMAPS_KEY
            }
        }
    },
    web: {
        favicon: "./assets/favicon.png"
    },
    plugins: [
        "expo-router"
    ],
    "extra": {
        "eas": {
            "projectId": "1c35fd48-f506-408c-9be2-6c4e771dad98"
        }
    }


});
