import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { StorageService, Waypoint } from './StorageService';
import { getDistance } from '../utils/geo';

const LOCATION_TASK_NAME = 'background-location-task';
const WAYPOINT_DISTANCE_THRESHOLD = 500; // 500 meters
const WAYPOINT_TIME_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    if (error) {
        console.error("Location task error:", error);
        return;
    }
    if (data) {
        const { locations } = data as { locations: Location.LocationObject[] };
        const latestLocation = locations[locations.length - 1];
        if (latestLocation) {
            await processLocation(latestLocation);
        }
    }
});

async function processLocation(location: Location.LocationObject) {
    const { latitude, longitude } = location.coords;
    const timestamp = location.timestamp; // ms

    const session = await StorageService.getCurrentSession();
    if (!session) return;

    const lastWaypoint = session.waypoints[session.waypoints.length - 1];

    let shouldLog = false;

    if (!lastWaypoint) {
        shouldLog = true; // Always log first point
    } else {
        const distance = getDistance(lastWaypoint.latitude, lastWaypoint.longitude, latitude, longitude);
        const timeDiff = timestamp - new Date(lastWaypoint.timestamp).getTime();

        if (distance >= WAYPOINT_DISTANCE_THRESHOLD || timeDiff >= WAYPOINT_TIME_THRESHOLD_MS) {
            shouldLog = true;
        }
    }

    if (shouldLog) {
        const newWaypoint: Waypoint = {
            latitude,
            longitude,
            timestamp: new Date(timestamp).toISOString(),
        };
        await StorageService.addWaypointToCurrent(newWaypoint);
        console.log("Waypoint recorded:", newWaypoint);
    }
}

export const LocationService = {
    async checkPermissions() {
        const { status: fgStatus } = await Location.getForegroundPermissionsAsync();
        if (fgStatus !== 'granted') return false;

        const { status: bgStatus } = await Location.getBackgroundPermissionsAsync();
        return bgStatus === 'granted';
    },

    async requestPermissions() {
        const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
        if (fgStatus !== 'granted') return false;

        const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
        return bgStatus === 'granted';
    },

    async startTracking() {
        const hasPermissions = await this.requestPermissions();
        if (!hasPermissions) {
            throw new Error("Location permissions not granted");
        }

        // Start session first
        await StorageService.startNewSession();

        // Capture initial location immediately
        const initialLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (initialLocation) {
            await processLocation(initialLocation);
        }

        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 100, // Update every 100 meters to check for landmarks
            deferredUpdatesInterval: 5000,
            foregroundService: {
                notificationTitle: "VeriTrack",
                notificationBody: "Tracking your session...",
            }
        });
        console.log("Tracking started (Session)");
    },

    async stopTracking() {
        const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
        if (isRegistered) {
            await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        }
        await StorageService.endCurrentSession();
        console.log("Tracking stopped (Session saved)");
    }
};
