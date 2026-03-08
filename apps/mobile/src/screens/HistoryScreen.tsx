import { useEffect, useState } from "react";
import { FlatList, SafeAreaView, StyleSheet } from "react-native";

import { getHistory } from "../services/api";
import { useAuth } from "../state/AuthContext";
import { CompletionItem } from "../types/api";
import { Title, Heading, BodySmall, Card, VStack, LoadingSpinner, EmptyState } from "../components";
import { theme } from "../theme";

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

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <LoadingSpinner message="Loading history..." />
            </SafeAreaView>
        );
    }

    const renderItem = ({ item }: { item: CompletionItem }) => (
        <Card padding="md" shadow="subtle">
            <VStack space="sm">
                <Heading>{item.prompt_title}</Heading>
                <BodySmall color={theme.colors.textSecondary}>
                    {item.date}
                    {item.location && ` • ${item.location}`}
                </BodySmall>
                {item.note && (
                    <BodySmall color={theme.colors.text}>{item.note}</BodySmall>
                )}
            </VStack>
        </Card>
    );

    return (
        <SafeAreaView style={styles.container}>
            <VStack style={styles.header}>
                <Title>History</Title>
            </VStack>

            {items.length === 0 ? (
                <EmptyState
                    icon="📚"
                    title="No history yet"
                    subtitle="Complete prompts to see your history"
                />
            ) : (
                <FlatList<CompletionItem>
                    data={items}
                    keyExtractor={(item) => item.completion_id}
                    contentContainerStyle={styles.list}
                    renderItem={renderItem}
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
});
