import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";

import { getActivePrompts } from "../services/api";
import { useAuth } from "../state/AuthContext";
import { Prompt } from "../types/api";
import { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
    const navigation = useNavigation<Nav>();
    const { token } = useAuth();
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");

    useEffect(() => {
        const run = async () => {
            if (!token) {
                return;
            }
            setLoading(true);
            setError("");
            try {
                const data = await getActivePrompts(token);
                setPrompts(data);
            } catch (err) {
                setError(String(err));
            } finally {
                setLoading(false);
            }
        };
        void run();
    }, [token]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Your Prompts</Text>
                <Text style={styles.subtitle}>Pick one and complete it today</Text>
            </View>
            {loading ? <ActivityIndicator style={styles.centered} /> : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <FlatList<Prompt>
                data={prompts}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <Pressable
                        style={styles.card}
                        onPress={() => navigation.navigate("PromptDetail", { promptId: item.id })}
                    >
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        <Text>{item.description}</Text>
                    </Pressable>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
    },
    subtitle: {
        color: "#666",
    },
    list: {
        padding: 16,
        gap: 12,
    },
    card: {
        borderWidth: 1,
        borderColor: "#111",
        padding: 16,
        borderRadius: 8,
        gap: 6,
    },
    cardTitle: {
        fontWeight: "700",
    },
    centered: {
        marginTop: 24,
    },
    error: {
        color: "crimson",
        paddingHorizontal: 16,
    },
});
