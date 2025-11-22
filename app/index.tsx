import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { LocationService } from '../services/LocationService';
import { StorageService, Session } from '../services/StorageService';

export default function HomeScreen() {
    const [currentSession, setCurrentSession] = useState<Session | null>(null);

    useEffect(() => {
        checkPermissions();
        loadStatus();
        const interval = setInterval(loadStatus, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    const checkPermissions = async () => {
        const hasPermission = await LocationService.checkPermissions();
        if (!hasPermission) {
            // If not granted, ask for it
            await LocationService.requestPermissions();
        }
    };

    const loadStatus = async () => {
        const session = await StorageService.getCurrentSession();
        setCurrentSession(session);
    };

    const toggleTracking = async () => {
        try {
            if (currentSession) {
                await LocationService.stopTracking();
            } else {
                await LocationService.startTracking();
            }
            await loadStatus();
        } catch (e) {
            Alert.alert("Error", (e as Error).message);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.status}>
                Status: {currentSession ? "Tracking Active" : "Ready to Track"}
            </Text>

            {currentSession && (
                <View style={styles.infoBox}>
                    <Text style={styles.infoTitle}>Current Session</Text>
                    <Text>Started: {new Date(currentSession.startTime).toLocaleTimeString()}</Text>
                    <Text>Waypoints: {currentSession.waypoints.length}</Text>
                    {currentSession.waypoints.length > 0 && (
                        <Text style={{ marginTop: 5, fontStyle: 'italic' }}>
                            Last update: {new Date(currentSession.waypoints[currentSession.waypoints.length - 1].timestamp).toLocaleTimeString()}
                        </Text>
                    )}
                </View>
            )}

            <TouchableOpacity
                style={[styles.button, currentSession ? styles.stopButton : styles.startButton]}
                onPress={toggleTracking}
            >
                <Text style={styles.buttonText}>
                    {currentSession ? "Stop Tracking" : "Start Tracking"}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    status: { fontSize: 20, marginBottom: 20, fontWeight: 'bold' },
    button: { padding: 20, borderRadius: 10, width: '100%', alignItems: 'center' },
    startButton: { backgroundColor: '#007AFF' },
    stopButton: { backgroundColor: '#FF3B30' },
    buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    infoBox: { marginBottom: 20, padding: 15, backgroundColor: '#f0f0f0', borderRadius: 8, width: '100%' },
    infoTitle: { fontWeight: 'bold', marginBottom: 5 },
});
