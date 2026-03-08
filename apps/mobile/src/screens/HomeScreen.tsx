import { useEffect, useState } from "react";
import { FlatList, SafeAreaView, StyleSheet } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";

import { getActivePrompts } from "../services/api";
import { useAuth } from "../state/AuthContext";
import { Prompt } from "../types/api";
import { RootStackParamList } from "../navigation/types";
import { Title, Body, Heading, Card, VStack, LoadingSpinner, EmptyState } from "../components";
import { theme } from "../theme";

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

    const renderPrompt = ({ item }: { item: Prompt }) => (
        <Card
            onPress={() => navigation.navigate("PromptDetail", { promptId: item.id })}
            padding="md"
            shadow="subtle"
            style={styles.promptCard}
        >
            <VStack space="sm">
                <Heading>{item.title}</Heading>
                <Body color={theme.colors.textSecondary}>{item.description}</Body>
            </VStack>
        </Card>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <LoadingSpinner message="Loading prompts..." />
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <EmptyState
                    icon="⚠️"
                    title="Something went wrong"
                    subtitle={error}
                    action={{
                        label: "Try again",
                        onPress: () => {
                            setLoading(true);
                            setError("");
                        },
                    }}
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <VStack style={styles.header}>
                <Title>Your Prompts</Title>
                <Body color={theme.colors.textSecondary}>
                    Pick one and complete it today
                </Body>
            </VStack>

            {prompts.length === 0 ? (
                <EmptyState
                    icon="📝"
                    title="No prompts available"
                    subtitle="Check back later for new prompts"
                />
            ) : (
                <FlatList<Prompt>
                    data={prompts}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    renderItem={renderPrompt}
                    scrollEnabled={false}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        paddingHorizontal: theme.spacing.base,
        paddingVertical: theme.spacing.base,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    list: {
        paddingHorizontal: theme.spacing.base,
        paddingVertical: theme.spacing.lg,
        gap: theme.spacing.md,
    },
    promptCard: {
        marginBottom: theme.spacing.sm,
    },
});
