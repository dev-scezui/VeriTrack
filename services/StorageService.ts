import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Waypoint {
    latitude: number;
    longitude: number;
    timestamp: string; // ISO string
    address?: string;
}

export interface Session {
    id: string;
    startTime: string;
    endTime?: string;
    waypoints: Waypoint[];
}

const KEYS = {
    SESSIONS: 'sessions_history',
    CURRENT_SESSION: 'current_session',
};

export const StorageService = {
    async getSessions(): Promise<Session[]> {
        try {
            const json = await AsyncStorage.getItem(KEYS.SESSIONS);
            return json ? JSON.parse(json) : [];
        } catch (e) {
            console.error('Failed to load sessions', e);
            return [];
        }
    },

    async saveSession(session: Session): Promise<void> {
        try {
            const sessions = await this.getSessions();
            // Check if session exists and update it, or add new
            const index = sessions.findIndex(s => s.id === session.id);
            if (index >= 0) {
                sessions[index] = session;
            } else {
                sessions.unshift(session);
            }
            await AsyncStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
        } catch (e) {
            console.error('Failed to save session', e);
        }
    },

    async getCurrentSession(): Promise<Session | null> {
        try {
            const json = await AsyncStorage.getItem(KEYS.CURRENT_SESSION);
            return json ? JSON.parse(json) : null;
        } catch (e) {
            return null;
        }
    },

    async startNewSession(): Promise<Session> {
        const newSession: Session = {
            id: Date.now().toString(),
            startTime: new Date().toISOString(),
            waypoints: []
        };
        await AsyncStorage.setItem(KEYS.CURRENT_SESSION, JSON.stringify(newSession));
        return newSession;
    },

    async addWaypointToCurrent(waypoint: Waypoint): Promise<void> {
        const session = await this.getCurrentSession();
        if (session) {
            session.waypoints.push(waypoint);
            await AsyncStorage.setItem(KEYS.CURRENT_SESSION, JSON.stringify(session));
        }
    },

    async endCurrentSession(): Promise<void> {
        const session = await this.getCurrentSession();
        if (session) {
            session.endTime = new Date().toISOString();
            await this.saveSession(session);
            await AsyncStorage.removeItem(KEYS.CURRENT_SESSION);
        }
    },

    // Helper to clear data if needed
    async clearAll() {
        await AsyncStorage.clear();
    }
};
