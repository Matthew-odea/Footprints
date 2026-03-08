import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Button,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { createComment, deleteComment, getCompletionById, listComments } from "../services/api";
import { useAuth } from "../state/AuthContext";
import { CommentItem, CompletionItem } from "../types/api";

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

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color="#4F46E5" />
            </SafeAreaView>
        );
    }

    if (!completion) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.errorText}>{error || "Entry not found"}</Text>
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
                        <View style={styles.commentContainer}>
                            <View style={styles.commentHeader}>
                                <Text style={styles.commentAuthor}>{item.user_display_name}</Text>
                                <Text style={styles.commentDate}>
                                    {new Date(item.created_at).toLocaleDateString()}
                                </Text>
                            </View>
                            <Text style={styles.commentText}>{item.text}</Text>
                            <Pressable
                                onPress={() => handleDeleteComment(item.comment_id)}
                                disabled={deletingCommentId === item.comment_id}
                            >
                                <Text style={styles.deleteButton}>
                                    {deletingCommentId === item.comment_id ? "Deleting..." : "Delete"}
                                </Text>
                            </Pressable>
                        </View>
                    )}
                    ListHeaderComponent={
                        <View>
                            {/* Entry photo */}
                            {completion.photo_url && (
                                <Image
                                    source={{ uri: completion.photo_url }}
                                    style={styles.photo}
                                />
                            )}

                            {/* Entry metadata */}
                            <View style={styles.metadata}>
                                <Text style={styles.promptTitle}>{completion.prompt_title}</Text>

                                <View style={styles.metadataRow}>
                                    <Text style={styles.label}>Date:</Text>
                                    <Text style={styles.value}>{completion.date}</Text>
                                </View>

                                {completion.category && (
                                    <View style={styles.metadataRow}>
                                        <Text style={styles.label}>Category:</Text>
                                        <Text style={styles.categoryBadge}>{completion.category}</Text>
                                    </View>
                                )}

                                {completion.location && (
                                    <View style={styles.metadataRow}>
                                        <Text style={styles.label}>Location:</Text>
                                        <Text style={styles.value}>{completion.location}</Text>
                                    </View>
                                )}

                                <Text style={styles.sectionTitle}>Notes</Text>
                                <Text style={styles.note}>{completion.note}</Text>

                                <Text style={styles.sectionTitle}>
                                    Comments ({comments.length})
                                </Text>
                            </View>
                        }
                    ListEmptyComponent={
                        !loading ? (
                            <Text style={styles.emptyText}>No comments yet. Be the first!</Text>
                        ) : null
                    }
                    contentContainerStyle={styles.listContent}
                />

                {/* Comment input */}
                <View style={styles.inputContainer}>
                    {error && <Text style={styles.errorText}>{error}</Text>}
                    <View style={styles.commentInputRow}>
                        <TextInput
                            placeholder="Add a comment..."
                            value={commentText}
                            onChangeText={setCommentText}
                            multiline
                            numberOfLines={2}
                            editable={!submittingComment}
                            style={styles.commentInput}
                        />
                        <Pressable
                            onPress={handleAddComment}
                            disabled={submittingComment || !commentText.trim()}
                            style={[styles.submitButton, (!commentText.trim() || submittingComment) && styles.submitButtonDisabled]}
                        >
                            <Text style={styles.submitButtonText}>
                                {submittingComment ? "..." : "Post"}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    flex: {
        flex: 1,
    },
    photo: {
        width: "100%",
        height: 300,
        backgroundColor: "#E5E7EB",
    },
    metadata: {
        padding: 16,
        backgroundColor: "#FFF",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },
    promptTitle: {
        fontSize: 20,
        fontWeight: "600",
        marginBottom: 12,
        color: "#1F2937",
    },
    metadataRow: {
        flexDirection: "row",
        marginBottom: 8,
        alignItems: "center",
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#6B7280",
        width: 80,
    },
    value: {
        fontSize: 14,
        color: "#1F2937",
        flex: 1,
    },
    categoryBadge: {
        fontSize: 12,
        fontWeight: "600",
        backgroundColor: "#EEF2FF",
        color: "#4F46E5",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        overflow: "hidden",
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginTop: 12,
        marginBottom: 8,
        color: "#1F2937",
    },
    note: {
        fontSize: 14,
        color: "#374151",
        lineHeight: 20,
    },
    listContent: {
        paddingBottom: 20,
    },
    commentContainer: {
        backgroundColor: "#FFF",
        marginHorizontal: 12,
        marginVertical: 8,
        padding: 12,
        borderRadius: 8,
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
    },
    commentHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    commentAuthor: {
        fontWeight: "600",
        fontSize: 14,
        color: "#1F2937",
    },
    commentDate: {
        fontSize: 12,
        color: "#9CA3AF",
    },
    commentText: {
        fontSize: 14,
        color: "#374151",
        marginBottom: 8,
        lineHeight: 20,
    },
    deleteButton: {
        fontSize: 12,
        color: "#EF4444",
        fontWeight: "500",
    },
    emptyText: {
        textAlign: "center",
        color: "#9CA3AF",
        marginVertical: 20,
    },
    errorText: {
        color: "#EF4444",
        textAlign: "center",
        padding: 12,
    },
    inputContainer: {
        backgroundColor: "#FFF",
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
        padding: 12,
    },
    commentInputRow: {
        flexDirection: "row",
        gap: 8,
    },
    commentInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 8,
        padding: 10,
        fontSize: 14,
        maxHeight: 80,
    },
    submitButton: {
        backgroundColor: "#4F46E5",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        justifyContent: "center",
    },
    submitButtonDisabled: {
        backgroundColor: "#D1D5DB",
    },
    submitButtonText: {
        color: "#FFF",
        fontWeight: "600",
        fontSize: 14,
    },
});
