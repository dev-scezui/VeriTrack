import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Share, Alert, Platform } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { StorageService, Session, Waypoint } from '../../services/StorageService';
import { format } from 'date-fns';

export default function ReportScreen() {
    const { id } = useLocalSearchParams();
    const [session, setSession] = useState<Session | null>(null);

    useEffect(() => {
        loadSession();
    }, [id]);

    const loadSession = async () => {
        const sessions = await StorageService.getSessions();
        const found = sessions.find(s => s.id === id);
        setSession(found || null);
    };

    const exportReport = async () => {
        if (!session) return;
        try {
            const json = JSON.stringify(session, null, 2);
            await Share.share({
                message: json,
                title: `Report ${format(new Date(session.startTime), 'yyyy-MM-dd')}`
            });
        } catch (error) {
            Alert.alert("Error", "Failed to export");
        }
    };

    if (!session) return <View style={styles.container}><Text>Loading...</Text></View>;

    const renderTimelineItem = ({ item, index }: { item: Waypoint, index: number }) => (
        <View style={styles.timelineItem}>
            <View style={styles.timelineLeft}>
                <View style={styles.dot} />
                {index < session.waypoints.length - 1 && <View style={styles.line} />}
            </View>
            <View style={styles.timelineContent}>
                <Text style={styles.time}>{format(new Date(item.timestamp), 'HH:mm')}</Text>
                <Text style={styles.coords}>Lat: {item.latitude.toFixed(4)}, Lon: {item.longitude.toFixed(4)}</Text>
                <Text style={styles.landmarkLabel}>Landmark {session.waypoints.length - index}</Text>
            </View>
        </View>
    );

    // Reverse waypoints for timeline (newest first)
    const timelineData = [...session.waypoints].reverse();
    const initialRegion = session.waypoints.length > 0 ? {
        latitude: session.waypoints[0].latitude,
        longitude: session.waypoints[0].longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    } : undefined;

    return (
        <View style={styles.container}>
            <Stack.Screen options={{
                title: 'Session Report', headerRight: () => (
                    <TouchableOpacity onPress={exportReport}><Text style={{ color: '#007AFF', fontWeight: 'bold' }}>Export</Text></TouchableOpacity>
                )
            }} />

            {Platform.OS !== 'web' ? (
                <View style={styles.mapContainer}>
                    <MapView style={styles.map} initialRegion={initialRegion}>
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
                                description={format(new Date(w.timestamp), 'HH:mm')}
                            />
                        ))}
                    </MapView>
                </View>
            ) : (
                <View style={[styles.mapContainer, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Text>Map not available on web</Text>
                </View>
            )}

            <View style={styles.timelineContainer}>
                <Text style={styles.sectionTitle}>Timeline</Text>
                <FlatList
                    data={timelineData}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={renderTimelineItem}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    mapContainer: { height: 300, width: '100%' },
    map: { flex: 1 },
    timelineContainer: { flex: 1, padding: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
    timelineItem: { flexDirection: 'row', marginBottom: 0 },
    timelineLeft: { alignItems: 'center', width: 30 },
    dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#007AFF', zIndex: 1 },
    line: { width: 2, flex: 1, backgroundColor: '#ddd', marginVertical: -5 },
    timelineContent: { flex: 1, paddingBottom: 20, paddingLeft: 10 },
    time: { fontWeight: 'bold', fontSize: 16 },
    coords: { color: '#666', fontSize: 12 },
    landmarkLabel: { color: '#007AFF', fontSize: 12, marginTop: 2 },
});
