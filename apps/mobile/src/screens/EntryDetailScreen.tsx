import { useEffect, useState } from "react";
import {
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    View,
} from "react-native";

import { addFavorite, createComment, deleteComment, getCompletionById, listComments, removeFavorite } from "../services/api";
import { useAuth } from "../state/AuthContext";
import { CommentItem, CompletionItem } from "../types/api";
import { Title, Heading, Body, Label, Card, Button, VStack, HStack, Input, LoadingSpinner, EmptyState, Badge } from "../components";
import { theme } from "../theme";

interface EntryDetailScreenProps {
    route: {
        params: {
            completionId: string;
        };
    };
    navigation: any;
}

export function EntryDetailScreen({ route, navigation }: EntryDetailScreenProps) {
    const { token } = useAuth();
    const { completionId } = route.params;

    const [completion, setCompletion] = useState<CompletionItem | null>(null);
    const [comments, setComments] = useState<CommentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [commentText, setCommentText] = useState("");
    const [submittingComment, setSubmittingComment] = useState(false);
    const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
    const [isFavorited, setIsFavorited] = useState(false);
    const [togglingFavorite, setTogglingFavorite] = useState(false);

    const loadData = async () => {
        if (!token) {
            setError("Not authenticated");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const [completionData, commentsData] = await Promise.all([
                getCompletionById(token, completionId),
                listComments(token, completionId),
            ]);

            setCompletion(completionData);
            setComments(commentsData);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load entry");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [completionId, token]);

    const handleAddComment = async () => {
        if (!token || !commentText.trim()) {
            return;
        }

        try {
            setSubmittingComment(true);
            const newComment = await createComment(token, completionId, commentText.trim());
            setComments([newComment, ...comments]);
            setCommentText("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to add comment");
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!token) {
            return;
        }

        try {
            setDeletingCommentId(commentId);
            await deleteComment(token, completionId, commentId);
            setComments(comments.filter((c) => c.comment_id !== commentId));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete comment");
        } finally {
            setDeletingCommentId(null);
        }
    };

    const handleToggleFavorite = async () => {
        if (!token || togglingFavorite) {
            return;
        }

        try {
            setTogglingFavorite(true);
            if (isFavorited) {
                await removeFavorite(token, completionId);
                setIsFavorited(false);
            } else {
                await addFavorite(token, completionId);
                setIsFavorited(true);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update favorite");
        } finally {
            setTogglingFavorite(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <LoadingSpinner message="Loading entry..." />
            </SafeAreaView>
        );
    }

    if (!completion) {
        return (
            <SafeAreaView style={styles.container}>
                <EmptyState
                    icon="🔍"
                    title="Entry not found"
                    subtitle={error || "This entry may have been deleted."}
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex}>
                <FlatList
                    data={comments}
                    keyExtractor={(item) => item.comment_id}
                    renderItem={({ item }) => (
                        <Card padding="md" style={styles.commentCard}>
                            <VStack space="sm">
                                <HStack justify="space-between" align="flex-start">
                                    <Heading>{item.user_display_name}</Heading>
                                    <Body style={{ color: theme.colors.textSecondary }}>
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </Body>
                                </HStack>
                                <Body>{item.text}</Body>
                                <Button
                                    label={deletingCommentId === item.comment_id ? "Deleting..." : "Delete"}
                                    onPress={() => handleDeleteComment(item.comment_id)}
                                    disabled={deletingCommentId === item.comment_id}
                                    variant="outline"
                                    size="sm"
                                />
                            </VStack>
                        </Card>
                    )}
                    ListHeaderComponent={
                        <View>
                            {/* Entry Photo */}
                            {completion.photo_url && (
                                <Image
                                    source={{ uri: completion.photo_url }}
                                    style={styles.photo}
                                />
                            )}

                            {/* Entry Metadata */}
                            <Card padding="lg" style={styles.metadataCard}>
                                <VStack space="lg">
                                    {/* Title + Favorite Button */}
                                    <HStack justify="space-between" align="flex-start">
                                        <Title>{completion.prompt_title}</Title>
                                        <Button
                                            label={isFavorited ? "❤️" : "🤍"}
                                            onPress={handleToggleFavorite}
                                            disabled={togglingFavorite}
                                            variant="ghost"
                                            size="sm"
                                        />
                                    </HStack>

                                    {/* Metadata Rows */}
                                    <VStack space="md">
                                        <HStack align="center">
                                            <Label style={{ minWidth: 80 }}>Date:</Label>
                                            <Body>{completion.date}</Body>
                                        </HStack>

                                        {completion.category && (
                                            <HStack align="center">
                                                <Label style={{ minWidth: 80 }}>Category:</Label>
                                                <Badge label={completion.category} />
                                            </HStack>
                                        )}

                                        {completion.location && (
                                            <HStack align="center">
                                                <Label style={{ minWidth: 80 }}>Location:</Label>
                                                <Body>{completion.location}</Body>
                                            </HStack>
                                        )}
                                    </VStack>

                                    {/* Notes Section */}
                                    <VStack space="sm">
                                        <Heading>Notes</Heading>
                                        <Body style={{ color: theme.colors.textSecondary }}>
                                            {completion.note}
                                        </Body>
                                    </VStack>

                                    {/* Comments Header */}
                                    <Heading>Comments ({comments.length})</Heading>
                                </VStack>
                            </Card>
                        </View>
                    }
                    ListEmptyComponent={
                        !loading ? (
                            <View style={styles.emptyCommentsContainer}>
                                <Body style={{ color: theme.colors.textSecondary }}>
                                    No comments yet. Be the first!
                                </Body>
                            </View>
                        ) : null
                    }
                    contentContainerStyle={styles.listContent}
                />

                {/* Comment Input */}
                <Card padding="md" style={styles.inputContainer}>
                    <VStack space="sm">
                        {error && <Body style={{ color: theme.colors.error }}>{error}</Body>}
                        <HStack space="sm">
                            <View style={{ flex: 1 }}>
                                <Input
                                    placeholder="Add a comment..."
                                    value={commentText}
                                    onChangeText={setCommentText}
                                    multiline
                                    disabled={submittingComment}
                                />
                            </View>
                            <Button
                                label={submittingComment ? "..." : "Post"}
                                onPress={handleAddComment}
                                disabled={submittingComment || !commentText.trim()}
                                variant="primary"
                                size="sm"
                            />
                        </HStack>
                    </VStack>
                </Card>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    flex: {
        flex: 1,
    },
    photo: {
        width: "100%",
        height: 300,
        backgroundColor: theme.colors.border,
    },
    metadataCard: {
        marginHorizontal: theme.spacing.base,
        marginVertical: theme.spacing.md,
    },
    commentCard: {
        marginHorizontal: theme.spacing.base,
        marginVertical: theme.spacing.sm,
    },
    listContent: {
        paddingBottom: theme.spacing.lg,
    },
    emptyCommentsContainer: {
        paddingVertical: theme.spacing.lg,
        alignItems: "center",
    },
    inputContainer: {
        marginHorizontal: theme.spacing.base,
        marginVertical: theme.spacing.base,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        paddingTop: theme.spacing.md,
    },
});
