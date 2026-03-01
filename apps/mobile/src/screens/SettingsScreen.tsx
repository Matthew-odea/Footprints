import { useEffect, useState } from "react";
import { ActivityIndicator, Button, SafeAreaView, StyleSheet, Switch, Text, View } from "react-native";

import { getMe, updateSettings } from "../services/api";
import { useAuth } from "../state/AuthContext";

export function SettingsScreen() {
    const { token, setToken } = useAuth();
    const [loading, setLoading] = useState(true);
    const [shareByDefault, setShareByDefault] = useState(true);
    const [username, setUsername] = useState("");

    useEffect(() => {
        const run = async () => {
            if (!token) {
                return;
            }
            setLoading(true);
            const me = await getMe(token);
            setShareByDefault(me.settings.share_by_default);
            setUsername(me.profile.username);
            setLoading(false);
        };
        void run();
    }, [token]);

    const onToggle = async (value: boolean) => {
        if (!token) {
            return;
        }
        setShareByDefault(value);
        await updateSettings(token, value);
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Settings</Text>
            {loading ? <ActivityIndicator style={styles.loading} /> : null}
            <View style={styles.card}>
                <Text style={styles.label}>Signed in as</Text>
                <Text style={styles.username}>{username || "-"}</Text>
            </View>
            <View style={styles.card}>
                <View style={styles.row}>
                    <Text>Share by default</Text>
                    <Switch value={shareByDefault} onValueChange={onToggle} />
                </View>
            </View>
            <View style={styles.logout}>
                <Button title="Log out" onPress={() => setToken(null)} />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        gap: 12,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
    },
    loading: {
        marginTop: 8,
    },
    card: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 12,
        gap: 6,
    },
    label: {
        color: "#666",
    },
    username: {
        fontWeight: "700",
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    logout: {
        marginTop: 12,
    },
});
