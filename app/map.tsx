import React, { useState } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { StorageService, Session } from '../services/StorageService';
import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import Constants from 'expo-constants';

export default function MapScreen() {
    const [session, setSession] = useState<Session | null>(null);
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const mapRef = useRef<MapView>(null);

    useFocusEffect(
        useCallback(() => {
            loadData();
            (async () => {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') return;

                let loc = await Location.getCurrentPositionAsync({});
                setLocation(loc);

                if (loc && mapRef.current) {
                    mapRef.current.animateToRegion({
                        latitude: loc.coords.latitude,
                        longitude: loc.coords.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    });
                }
            })();
        }, [])
    );

    const loadData = async () => {
        // Show current active session, or the latest recorded session
        let current = await StorageService.getCurrentSession();
        if (!current) {
            const sessions = await StorageService.getSessions();
            if (sessions.length > 0) current = sessions[0];
        }
        setSession(current);
    };

    // Safe Map Check
    const apiKey = Constants.expoConfig?.android?.config?.googleMaps?.apiKey;
    const isMapConfigured = Platform.OS !== 'android' || (apiKey && apiKey.length > 0 && apiKey !== "YOUR_GOOGLE_MAPS_API_KEY_HERE");

    if (Platform.OS === 'web') {
        return (
            <View style={styles.container}>
                <Text style={{ textAlign: 'center', marginTop: 20 }}>Map is not supported on web</Text>
            </View>
        );
    }

    if (!isMapConfigured) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Map Unavailable</Text>
                <Text style={{ textAlign: 'center', color: '#666' }}>
                    Google Maps API Key is missing or invalid. Please configure it in app.config.ts or via EAS secrets to view the map.
                    API Key: {apiKey}
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                style={styles.map}
                showsUserLocation
                initialRegion={{
                    latitude: location?.coords.latitude || 37.78825,
                    longitude: location?.coords.longitude || -122.4324,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
            >
                {session && (
                    <>
                        <Polyline
                            coordinates={session.waypoints.map(w => ({ latitude: w.latitude, longitude: w.longitude }))}
                            strokeColor="#007AFF"
                            strokeWidth={3}
                        />
                        {session.waypoints.map((w, i) => (
                            <Marker
                                key={i}
                                coordinate={{ latitude: w.latitude, longitude: w.longitude }}
                                title={`Landmark ${i + 1}`}
                            />
                        ))}
                    </>
                )}
            </MapView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { width: '100%', height: '100%' },
});
