import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { StorageService, Session } from '../services/StorageService';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';

export default function HistoryScreen() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const router = useRouter();

    useEffect(() => {
        loadSessions();
        const interval = setInterval(loadSessions, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadSessions = async () => {
        const data = await StorageService.getSessions();
        setSessions(data);
    };

    const renderItem = ({ item }: { item: Session }) => (
        <TouchableOpacity
            style={styles.item}
            onPress={() => router.push({ pathname: "/report/[id]", params: { id: item.id } })}
        >
            <Text style={styles.time}>
                {format(new Date(item.startTime), 'MMM d, HH:mm')}
            </Text>
            <Text style={styles.details}>
                {item.endTime ? `Ended: ${format(new Date(item.endTime), 'HH:mm')}` : 'Active'} • {item.waypoints.length} landmarks
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={sessions}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                ListEmptyComponent={<Text style={styles.empty}>No sessions recorded yet.</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    item: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    time: { fontSize: 16, fontWeight: 'bold' },
    details: { color: '#666', marginTop: 5 },
    empty: { textAlign: 'center', marginTop: 50, color: '#999' },
});
