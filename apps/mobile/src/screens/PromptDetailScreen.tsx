import { useEffect, useState } from "react";
import { ActivityIndicator, Button, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";

import { RootStackParamList } from "../navigation/types";
import { getPromptById } from "../services/api";
import { useAuth } from "../state/AuthContext";
import { Prompt } from "../types/api";

type ScreenProps = NativeStackScreenProps<RootStackParamList, "PromptDetail">;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export function PromptDetailScreen({ route }: ScreenProps) {
    const navigation = useNavigation<Nav>();
    const { token } = useAuth();
    const [prompt, setPrompt] = useState<Prompt | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const run = async () => {
            if (!token) {
                return;
            }
            setLoading(true);
            const data = await getPromptById(token, route.params.promptId);
            setPrompt(data);
            setLoading(false);
        };
        void run();
    }, [route.params.promptId, token]);

    if (loading) {
        return <ActivityIndicator style={{ marginTop: 32 }} />;
    }

    if (!prompt) {
        return <Text style={{ marginTop: 32, textAlign: "center" }}>Prompt not found</Text>;
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>{prompt.title}</Text>
                <Text style={styles.description}>{prompt.description}</Text>
                <Text style={styles.section}>How to get started</Text>
                <View style={styles.list}>
                    {prompt.guidance.map((item, index) => (
                        <Text key={`${item}-${index}`} style={styles.listItem}>{`${index + 1}. ${item}`}</Text>
                    ))}
                </View>
                <Button
                    title="Upload completion"
                    onPress={() => navigation.navigate("PromptUpload", { promptId: prompt.id })}
                />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 16,
        gap: 12,
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
    },
    description: {
        color: "#444",
    },
    section: {
        fontWeight: "700",
        marginTop: 8,
    },
    list: {
        gap: 8,
        marginBottom: 16,
    },
    listItem: {
        color: "#222",
    },
});
