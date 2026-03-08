import { getCompletionById, listComments, createComment, deleteComment, addFavorite, removeFavorite, getFavoriteCompletions } from "../api";

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("Entry Detail API", () => {
    beforeEach(() => {
        mockFetch.mockClear();
    });

    describe("getCompletionById", () => {
        it("fetches a single completion by ID", async () => {
            const mockCompletion = {
                completion_id: "comp-1",
                prompt_id: "prompt-1",
                prompt_title: "Plant a tree",
                category: "environment",
                note: "Planted an oak tree",
                date: "2026-03-08",
                location: "Park",
                photo_url: "https://example.com/photo.jpg",
                share_with_friends: true,
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockCompletion,
                text: async () => JSON.stringify(mockCompletion),
            });

            const result = await getCompletionById("token-123", "comp-1");

            expect(result).toEqual(mockCompletion);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining("/archive/completions/comp-1"),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: "Bearer token-123",
                    }),
                })
            );
        });
    });

    describe("listComments", () => {
        it("fetches comments for a completion", async () => {
            const mockComments = {
                items: [
                    {
                        comment_id: "comment-1",
                        completion_id: "comp-1",
                        user_id: "user-alice",
                        user_display_name: "Alice",
                        text: "Great activity!",
                        created_at: "2026-03-08T10:00:00Z",
                        updated_at: "2026-03-08T10:00:00Z",
                        parent_comment_id: null,
                        reply_count: 0,
                    },
                ],
                total: 1,
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockComments,
                text: async () => JSON.stringify(mockComments),
            });

            const result = await listComments("token-123", "comp-1");

            expect(result).toEqual(mockComments.items);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining("/completions/comp-1/comments"),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: "Bearer token-123",
                    }),
                })
            );
        });

        it("returns empty array for completion with no comments", async () => {
            const mockComments = { items: [], total: 0 };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockComments,
                text: async () => JSON.stringify(mockComments),
            });

            const result = await listComments("token-123", "comp-1");

            expect(result).toEqual([]);
        });
    });

    describe("createComment", () => {
        it("creates a new comment", async () => {
            const mockNewComment = {
                item: {
                    comment_id: "comment-new",
                    completion_id: "comp-1",
                    user_id: "user-alice",
                    user_display_name: "Alice",
                    text: "My new comment",
                    created_at: "2026-03-08T11:00:00Z",
                    updated_at: "2026-03-08T11:00:00Z",
                    parent_comment_id: null,
                    reply_count: 0,
                },
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockNewComment,
                text: async () => JSON.stringify(mockNewComment),
            });

            const result = await createComment("token-123", "comp-1", "My new comment");

            expect(result).toEqual(mockNewComment.item);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining("/completions/comp-1/comments"),
                expect.objectContaining({
                    method: "POST",
                    body: JSON.stringify({
                        text: "My new comment",
                        parent_comment_id: null,
                    }),
                    headers: expect.objectContaining({
                        Authorization: "Bearer token-123",
                    }),
                })
            );
        });

        it("creates a reply to a comment", async () => {
            const mockReplyComment = {
                item: {
                    comment_id: "comment-reply",
                    completion_id: "comp-1",
                    user_id: "user-alice",
                    user_display_name: "Alice",
                    text: "My reply",
                    created_at: "2026-03-08T11:05:00Z",
                    updated_at: "2026-03-08T11:05:00Z",
                    parent_comment_id: "comment-1",
                    reply_count: 0,
                },
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockReplyComment,
                text: async () => JSON.stringify(mockReplyComment),
            });

            const result = await createComment("token-123", "comp-1", "My reply", "comment-1");

            expect(result.parent_comment_id).toBe("comment-1");
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining("/completions/comp-1/comments"),
                expect.objectContaining({
                    body: JSON.stringify({
                        text: "My reply",
                        parent_comment_id: "comment-1",
                    }),
                })
            );
        });
    });

    describe("deleteComment", () => {
        it("deletes a comment successfully", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ status: "deleted" }),
                text: async () => JSON.stringify({ status: "deleted" }),
            });

            await deleteComment("token-123", "comp-1", "comment-1");

            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining("/completions/comp-1/comments/comment-1"),
                expect.objectContaining({
                    method: "DELETE",
                    headers: expect.objectContaining({
                        Authorization: "Bearer token-123",
                    }),
                })
            );
        });

        it("throws error when delete fails", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                text: async () => "Comment not found",
            });

            await expect(deleteComment("token-123", "comp-1", "nonexistent")).rejects.toThrow();
        });
    });

    describe("addFavorite", () => {
        it("adds a completion to favorites", async () => {
            const mockResponse = {
                status: "favorited",
                favorite_id: "fav-1",
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
                text: async () => JSON.stringify(mockResponse),
            });

            const result = await addFavorite("token-123", "comp-1");

            expect(result).toEqual(mockResponse);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining("/completions/comp-1/favorite"),
                expect.objectContaining({
                    method: "POST",
                    headers: expect.objectContaining({
                        Authorization: "Bearer token-123",
                    }),
                })
            );
        });
    });

    describe("removeFavorite", () => {
        it("removes a completion from favorites", async () => {
            const mockResponse = {
                status: "unfavorited",
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
                text: async () => JSON.stringify(mockResponse),
            });

            const result = await removeFavorite("token-123", "comp-1");

            expect(result).toEqual(mockResponse);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining("/completions/comp-1/favorite"),
                expect.objectContaining({
                    method: "DELETE",
                    headers: expect.objectContaining({
                        Authorization: "Bearer token-123",
                    }),
                })
            );
        });
    });

    describe("getFavoriteCompletions", () => {
        it("fetches all favorite completions", async () => {
            const mockFavorites = [
                {
                    completion_id: "comp-1",
                    prompt_id: "prompt-1",
                    prompt_title: "Plant a tree",
                    category: "environment",
                    note: "Planted an oak tree",
                    date: "2026-03-08",
                    location: "Park",
                    photo_url: "https://example.com/photo.jpg",
                    share_with_friends: true,
                },
                {
                    completion_id: "comp-2",
                    prompt_id: "prompt-2",
                    prompt_title: "Clean beach",
                    category: "environment",
                    note: "Cleaned up trash",
                    date: "2026-03-09",
                    location: "Beach",
                    photo_url: "https://example.com/photo2.jpg",
                    share_with_friends: true,
                },
            ];

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockFavorites,
                text: async () => JSON.stringify(mockFavorites),
            });

            const result = await getFavoriteCompletions("token-123");

            expect(result).toEqual(mockFavorites);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining("/favorites"),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: "Bearer token-123",
                    }),
                })
            );
        });

        it("returns empty array when no favorites", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => [],
                text: async () => "[]",
            });

            const result = await getFavoriteCompletions("token-123");

            expect(result).toEqual([]);
        });
    });
});
