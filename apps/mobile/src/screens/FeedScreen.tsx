import React, { useEffect, useState } from "react";
import {
    FlatList,
    StyleSheet,
    Image,
    RefreshControl,
    View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getFeed, FeedItem } from "../services/upload";
import { useAuth } from "../state/AuthContext";
import { Card, Body, Title, Heading, Button, VStack, HStack, LoadingSpinner, EmptyState } from "../components";
import { theme } from "../theme";

export function FeedScreen() {
    const { token } = useAuth();
    const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
    const [scope, setScope] = useState<"all" | "friends">("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cursor, setCursor] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    const loadFeed = async (nextCursor?: string) => {
        try {
            if (!token) {
                setError("Not authenticated");
                setLoading(false);
                return;
            }

            const result = await getFeed(token, 20, nextCursor, scope);
            if (nextCursor) {
                setFeedItems((prev) => [...prev, ...result.items]);
            } else {
                setFeedItems(result.items);
            }
            setCursor(result.next_cursor || null);
            setError(null);
        } catch (err) {
            setError(String(err));
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            setLoading(true);
            setFeedItems([]);
            setCursor(null);
            loadFeed();
        }, [token, scope])
    );

    const onRefresh = () => {
        setRefreshing(true);
        setFeedItems([]);
        setCursor(null);
        loadFeed();
    };

    const onEndReached = () => {
        if (cursor && !loadingMore && !loading) {
            setLoadingMore(true);
            loadFeed(cursor);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
        });
    };

    const renderItem = ({ item }: { item: FeedItem }) => (
        <Card padding="md">
            <VStack space="md">
                {/* User and Date Header */}
                <HStack justify="space-between" align="flex-start">
                    <Title size="sm">{item.user_display_name}</Title>
                    <Body size="sm" style={{ color: theme.colors.textSecondary }}>
                        {formatDate(item.created_at)}
                    </Body>
                </HStack>

                {/* Prompt Title */}
                <Heading size="sm">{item.prompt_title}</Heading>

                {/* Photo */}
                {item.photo_url && (
                    <Image
                        source={{ uri: item.photo_url }}
                        style={styles.photo}
                        onError={() => console.log("Image failed to load")}
                    />
                )}

                {/* Note */}
                {item.note && <Body>{item.note}</Body>}

                {/* Metadata (Location + Date) */}
                <HStack space="md">
                    {item.location && (
                        <Body size="sm" style={{ color: theme.colors.textSecondary }}>
                            📍 {item.location}
                        </Body>
                    )}
                    {item.date && (
                        <Body size="sm" style={{ color: theme.colors.textSecondary }}>
                            📅 {item.date}
                        </Body>
                    )}
                </HStack>
            </VStack>
        </Card>
    );

    const renderEmpty = () => (
        <EmptyState
            icon="📱"
            title="No activity yet"
            subtitle="Check back soon for updates from your friends!"
        />
    );

    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View style={styles.footerLoader}>
                <LoadingSpinner message="" />
            </View>
        );
    };

    if (loading && feedItems.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <LoadingSpinner message="Loading feed..." />
            </View>
        );
    }

    if (error && feedItems.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <VStack space="lg" align="center">
                    <Body style={{ color: theme.colors.error }}>{error}</Body>
                    <Button
                        label="Retry"
                        onPress={onRefresh}
                        variant="primary"
                    />
                </VStack>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Scope Toggle */}
            <HStack space="sm" style={styles.toggleRow}>
                <Button
                    label="All"
                    onPress={() => setScope("all")}
                    variant={scope === "all" ? "primary" : "outline"}
                    flex={1}
                    size="sm"
                />
                <Button
                    label="Friends"
                    onPress={() => setScope("friends")}
                    variant={scope === "friends" ? "primary" : "outline"}
                    flex={1}
                    size="sm"
                />
            </HStack>

            {/* Feed List */}
            <FlatList
                data={feedItems}
                renderItem={renderItem}
                keyExtractor={(item) => item.completion_id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={renderEmpty}
                ListFooterComponent={renderFooter}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                onEndReached={onEndReached}
                onEndReachedThreshold={0.5}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    toggleRow: {
        paddingHorizontal: theme.spacing.base,
        paddingVertical: theme.spacing.sm,
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: theme.spacing.base,
    },
    listContent: {
        paddingHorizontal: theme.spacing.base,
        paddingVertical: theme.spacing.base,
        gap: theme.spacing.md,
    },
    photo: {
        width: "100%",
        height: 200,
        borderRadius: theme.radius.base,
        backgroundColor: theme.colors.border,
    },
    footerLoader: {
        paddingVertical: theme.spacing.lg,
        justifyContent: "center",
        alignItems: "center",
    },
});
