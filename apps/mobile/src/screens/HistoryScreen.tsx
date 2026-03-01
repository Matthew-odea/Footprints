import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { getHistory } from "../services/api";
import { useAuth } from "../state/AuthContext";
import { CompletionItem } from "../types/api";

export function HistoryScreen() {
    const { token } = useAuth();
    const [items, setItems] = useState<CompletionItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const run = async () => {
            if (!token) {
                return;
            }
            setLoading(true);
            const history = await getHistory(token);
            setItems(history);
            setLoading(false);
        };
        void run();
    }, [token]);

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>History</Text>
            {loading ? <ActivityIndicator style={styles.loading} /> : null}
            <FlatList<CompletionItem>
                data={items}
                keyExtractor={(item) => item.completion_id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>{item.prompt_title}</Text>
                        <Text>{item.date}</Text>
                        <Text>{item.location}</Text>
                        <Text>{item.note}</Text>
                    </View>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        padding: 16,
    },
    loading: {
        marginTop: 12,
    },
    list: {
        padding: 16,
        gap: 10,
    },
    card: {
        borderWidth: 1,
        borderColor: "#111",
        borderRadius: 8,
        padding: 12,
        gap: 4,
    },
    cardTitle: {
        fontWeight: "700",
    },
});
