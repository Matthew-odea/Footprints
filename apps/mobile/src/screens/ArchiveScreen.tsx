import { useMemo, useState, useEffect, useRef } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    PanResponder,
    Pressable,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { getArchiveCompletions, getFavoriteCompletions } from "../services/api";
import { useAuth } from "../state/AuthContext";
import { CompletionItem } from "../types/api";

type ViewMode = "calendar" | "timeline" | "favorites";

type CalendarCell = {
    date: Date;
    dateKey: string;
    inCurrentMonth: boolean;
};

function formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function getMonthRange(monthDate: Date): { startDate: string; endDate: string } {
    const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const last = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    return { startDate: formatDateKey(first), endDate: formatDateKey(last) };
}

function buildMonthGrid(monthDate: Date): CalendarCell[] {
    const firstOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const start = new Date(firstOfMonth);
    start.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());

    const cells: CalendarCell[] = [];
    for (let index = 0; index < 42; index += 1) {
        const date = new Date(start);
        date.setDate(start.getDate() + index);
        cells.push({
            date,
            dateKey: formatDateKey(date),
            inCurrentMonth: date.getMonth() === monthDate.getMonth(),
        });
    }
    return cells;
}

function monthLabel(date: Date): string {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

interface ArchiveScreenProps {
    navigation: any;
}

export function ArchiveScreen({ navigation }: ArchiveScreenProps) {
    const { token } = useAuth();
    const timelineListRef = useRef<FlatList<CompletionItem> | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>("calendar");
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [items, setItems] = useState<CompletionItem[]>([]);
    const [allTimelineItems, setAllTimelineItems] = useState<CompletionItem[]>([]);
    const [timelineOffset, setTimelineOffset] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [favoriteItems, setFavoriteItems] = useState<CompletionItem[]>([]);

    const dateToCompletion = useMemo(() => {
        const map = new Map<string, CompletionItem>();
        for (const item of items) {
            if (!map.has(item.date)) {
                map.set(item.date, item);
            }
        }
        return map;
    }, [items]);

    const monthCells = useMemo(() => buildMonthGrid(currentMonth), [currentMonth]);

    const loadCalendarMonth = async (month: Date, withRefresh: boolean = false) => {
        if (!token) {
            return;
        }
        const { startDate, endDate } = getMonthRange(month);

        if (withRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        setError("");

        try {
            const completions = await getArchiveCompletions(token, startDate, endDate, 100, 0);
            setItems(completions);
            setSelectedDate(null);
        } catch (err) {
            setError(String(err));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const loadTimeline = async (offset: number, append: boolean) => {
        if (!token) {
            return;
        }

        if (!append) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }
        setError("");

        try {
            const completions = await getArchiveCompletions(token, "1900-01-01", "2100-12-31", 20, offset);
            setAllTimelineItems((prev) => (append ? [...prev, ...completions] : completions));
            setTimelineOffset(offset + completions.length);
        } catch (err) {
            setError(String(err));
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const loadFavorites = async () => {
        if (!token) {
            return;
        }

        setLoading(true);
        setError("");

        try {
            const completions = await getFavoriteCompletions(token);
            setFavoriteItems(completions);
        } catch (err) {
            setError(String(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (viewMode === "calendar") {
            void loadCalendarMonth(currentMonth);
            return;
        }
        if (viewMode === "favorites") {
            void loadFavorites();
            return;
        }
        void loadTimeline(0, false);
    }, [token, viewMode, currentMonth]);

    const onRefresh = () => {
        if (viewMode === "calendar") {
            void loadCalendarMonth(currentMonth, true);
            return;
        }
        if (viewMode === "favorites") {
            setRefreshing(true);
            void loadFavorites().finally(() => setRefreshing(false));
            return;
        }
        setRefreshing(true);
        void loadTimeline(0, false).finally(() => setRefreshing(false));
    };

    const onNextMonth = () => {
        setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const onPreviousMonth = () => {
        setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const monthSwipeResponder = useMemo(
        () =>
            PanResponder.create({
                onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 18,
                onPanResponderRelease: (_, gestureState) => {
                    if (gestureState.dx > 40) {
                        onPreviousMonth();
                    } else if (gestureState.dx < -40) {
                        onNextMonth();
                    }
                },
            }),
        []
    );

    const loadMoreTimeline = () => {
        if (loadingMore) {
            return;
        }
        void loadTimeline(timelineOffset, true);
    };

    const onCalendarDayPress = (dateKey: string) => {
        const targetIndex = items.findIndex((item) => item.date === dateKey);
        if (targetIndex < 0) {
            setSelectedDate(null);
            return;
        }

        setSelectedDate(dateKey);
        timelineListRef.current?.scrollToIndex({ index: targetIndex, animated: true, viewPosition: 0.15 });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.title}>Archive</Text>
                <View style={styles.segmentedControl}>
                    <Pressable
                        style={[styles.segmentButton, viewMode === "calendar" && styles.segmentButtonActive]}
                        onPress={() => setViewMode("calendar")}
                    >
                        <Text style={[styles.segmentText, viewMode === "calendar" && styles.segmentTextActive]}>
                            Calendar
                        </Text>
                    </Pressable>
                    <Pressable
                        style={[styles.segmentButton, viewMode === "timeline" && styles.segmentButtonActive]}
                        onPress={() => setViewMode("timeline")}
                    >
                        <Text style={[styles.segmentText, viewMode === "timeline" && styles.segmentTextActive]}>
                            Timeline
                        </Text>
                    </Pressable>
                    <Pressable
                        style={[styles.segmentButton, viewMode === "favorites" && styles.segmentButtonActive]}
                        onPress={() => setViewMode("favorites")}
                    >
                        <Text style={[styles.segmentText, viewMode === "favorites" && styles.segmentTextActive]}>
                            Favorites
                        </Text>
                    </Pressable>
                </View>
            </View>

            {loading ? <ActivityIndicator style={styles.loading} /> : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            {viewMode === "calendar" ? (
                <View style={styles.calendarContainer} {...monthSwipeResponder.panHandlers}>
                    <View style={styles.monthNavRow}>
                        <Pressable style={styles.monthNavButton} onPress={onPreviousMonth}>
                            <Text style={styles.monthNavText}>‹</Text>
                        </Pressable>
                        <Text style={styles.monthLabel}>{monthLabel(currentMonth)}</Text>
                        <Pressable style={styles.monthNavButton} onPress={onNextMonth}>
                            <Text style={styles.monthNavText}>›</Text>
                        </Pressable>
                    </View>

                    <View style={styles.dayHeaderRow}>
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                            <Text key={day} style={styles.dayHeaderText}>{day}</Text>
                        ))}
                    </View>

                    <View style={styles.grid}>
                        {monthCells.map((cell) => {
                            const completion = dateToCompletion.get(cell.dateKey);
                            const isSelected = selectedDate === cell.dateKey;
                            return (
                                <Pressable
                                    key={cell.dateKey}
                                    onPress={() => onCalendarDayPress(completion ? cell.dateKey : "")}
                                    style={[
                                        styles.cell,
                                        !cell.inCurrentMonth && styles.outsideCell,
                                        isSelected && styles.selectedCell,
                                    ]}
                                >
                                    {completion?.photo_url ? (
                                        <Image source={{ uri: completion.photo_url }} style={styles.thumbnail} />
                                    ) : null}
                                    {!completion?.photo_url ? (
                                        <Text style={[styles.cellText, !cell.inCurrentMonth && styles.outsideCellText]}>
                                            {cell.date.getDate()}
                                        </Text>
                                    ) : null}
                                </Pressable>
                            );
                        })}
                    </View>

                    <FlatList
                        ref={timelineListRef}
                        data={items}
                        keyExtractor={(item) => item.completion_id}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                        onScrollToIndexFailed={(info) => {
                            setTimeout(() => {
                                timelineListRef.current?.scrollToOffset({
                                    offset: info.averageItemLength * info.index,
                                    animated: true,
                                });
                            }, 100);
                        }}
                        renderItem={({ item }) => (
                            <Pressable
                                style={styles.timelineCard}
                                onPress={() => navigation.navigate('EntryDetail', { completionId: item.completion_id })}
                            >
                                <Text style={styles.timelineCardTitle}>{item.prompt_title}</Text>
                                <Text>{item.date}</Text>
                                <Text>{item.location}</Text>
                                <Text>{item.note}</Text>
                            </Pressable>
                        )}
                        ListEmptyComponent={
                            <Text style={styles.emptyText}>
                                No entries in this month
                            </Text>
                        }
                        contentContainerStyle={styles.timelineList}
                    />
                </View>
            ) : (
                <FlatList
                    data={allTimelineItems}
                    keyExtractor={(item) => item.completion_id}
                    numColumns={2}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    renderItem={({ item }) => (
                        <Pressable
                            style={styles.galleryCell}
                            onPress={() => navigation.navigate('EntryDetail', { completionId: item.completion_id })}
                        >
                            {item.photo_url ? (
                                <Image source={{ uri: item.photo_url }} style={styles.galleryImage} />
                            ) : (
                                <View style={styles.galleryImageFallback}>
                                    <Text style={styles.galleryFallbackText}>No Photo</Text>
                                </View>
                            )}
                            <View style={styles.galleryMeta}>
                                <Text style={styles.galleryDate}>{item.date}</Text>
                                {item.category ? <Text style={styles.galleryCategory}>{item.category}</Text> : null}
                                <Text style={styles.galleryPrompt} numberOfLines={1}>{item.prompt_title}</Text>
                            </View>
                        </Pressable>
                    )}
                    ListEmptyComponent={<Text style={styles.emptyText}>No timeline items yet</Text>}
                    contentContainerStyle={styles.galleryList}
                    onEndReachedThreshold={0.6}
                    onEndReached={loadMoreTimeline}
                    ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footerLoader} /> : null}
                />
            ) : viewMode === "favorites" ? (
                <FlatList
                    data={favoriteItems}
                    keyExtractor={(item) => item.completion_id}
                    numColumns={2}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    renderItem={({ item }) => (
                        <Pressable
                            style={styles.galleryCell}
                            onPress={() => navigation.navigate('EntryDetail', { completionId: item.completion_id })}
                        >
                            {item.photo_url ? (
                                <Image source={{ uri: item.photo_url }} style={styles.galleryImage} />
                            ) : (
                                <View style={styles.galleryImageFallback}>
                                    <Text style={styles.galleryFallbackText}>No Photo</Text>
                                </View>
                            )}
                            <View style={styles.galleryMeta}>
                                <Text style={styles.galleryDate}>{item.date}</Text>
                                {item.category ? <Text style={styles.galleryCategory}>{item.category}</Text> : null}
                                <Text style={styles.galleryPrompt} numberOfLines={1}>{item.prompt_title}</Text>
                            </View>
                        </Pressable>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No favorites yet</Text>
                            <Text style={styles.emptySubtext}>Tap the heart icon on entries to save them here</Text>
                        </View>
                    }
                    contentContainerStyle={styles.galleryList}
                />
            ) : null}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFF9F3",
    },
    headerRow: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#6D3D2A",
        marginBottom: 10,
    },
    segmentedControl: {
        flexDirection: "row",
        backgroundColor: "#F2EDE7",
        borderRadius: 10,
        padding: 4,
    },
    segmentButton: {
        flex: 1,
        borderRadius: 8,
        paddingVertical: 8,
        alignItems: "center",
    },
    segmentButtonActive: {
        backgroundColor: "#C56A47",
    },
    segmentText: {
        color: "#6D3D2A",
        fontWeight: "600",
    },
    segmentTextActive: {
        color: "#FFF",
    },
    loading: {
        marginTop: 10,
    },
    error: {
        color: "#B00020",
        paddingHorizontal: 16,
        paddingVertical: 6,
    },
    calendarContainer: {
        flex: 1,
    },
    monthNavRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    monthNavButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F2EDE7",
    },
    monthNavText: {
        fontSize: 24,
        color: "#6D3D2A",
    },
    monthLabel: {
        fontSize: 18,
        fontWeight: "700",
        color: "#6D3D2A",
    },
    dayHeaderRow: {
        flexDirection: "row",
        paddingHorizontal: 12,
        marginBottom: 6,
    },
    dayHeaderText: {
        flex: 1,
        textAlign: "center",
        fontSize: 12,
        color: "#7E8A7B",
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        paddingHorizontal: 12,
        rowGap: 6,
    },
    cell: {
        width: "14.2857%",
        aspectRatio: 1,
        borderRadius: 8,
        backgroundColor: "#F2EDE7",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },
    selectedCell: {
        borderWidth: 2,
        borderColor: "#C56A47",
    },
    outsideCell: {
        opacity: 0.45,
    },
    cellText: {
        color: "#6D3D2A",
        fontSize: 12,
    },
    outsideCellText: {
        color: "#A7A7A7",
    },
    thumbnail: {
        width: "100%",
        height: "100%",
    },
    timelineList: {
        padding: 12,
        gap: 8,
    },
    timelineCard: {
        borderWidth: 1,
        borderColor: "#E6DDD4",
        borderRadius: 10,
        backgroundColor: "#FFF",
        padding: 10,
        gap: 2,
    },
    timelineCardTitle: {
        fontWeight: "700",
        color: "#3A312C",
    },
    emptyText: {
        textAlign: "center",
        color: "#7E8A7B",
        padding: 16,
    },
    emptyContainer: {
        alignItems: "center",
        padding: 32,
    },
    emptySubtext: {
        textAlign: "center",
        color: "#9CA3AF",
        fontSize: 14,
        marginTop: 8,
    },
    galleryList: {
        padding: 8,
    },
    galleryCell: {
        width: "50%",
        padding: 6,
    },
    galleryImage: {
        width: "100%",
        aspectRatio: 1,
        borderRadius: 8,
        backgroundColor: "#EEE",
    },
    galleryImageFallback: {
        width: "100%",
        aspectRatio: 1,
        borderRadius: 8,
        backgroundColor: "#E8E8E8",
        alignItems: "center",
        justifyContent: "center",
    },
    galleryFallbackText: {
        color: "#777",
        fontSize: 12,
    },
    galleryMeta: {
        position: "absolute",
        left: 10,
        right: 10,
        bottom: 10,
        backgroundColor: "rgba(0,0,0,0.35)",
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 4,
    },
    galleryDate: {
        color: "#FFF",
        fontSize: 11,
        fontWeight: "700",
    },
    galleryCategory: {
        color: "#F5D6A0",
        fontSize: 10,
        fontWeight: "700",
        textTransform: "uppercase",
    },
    galleryPrompt: {
        color: "#FFF",
        fontSize: 10,
    },
    footerLoader: {
        paddingVertical: 16,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.35)",
        justifyContent: "center",
        padding: 16,
    },
    modalCard: {
        backgroundColor: "#FFF",
        borderRadius: 12,
        padding: 12,
        gap: 8,
    },
    modalClose: {
        alignSelf: "flex-end",
    },
    modalCloseText: {
        color: "#C56A47",
        fontWeight: "700",
    },
    modalImage: {
        width: "100%",
        aspectRatio: 1,
        borderRadius: 8,
        backgroundColor: "#EEE",
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#3A312C",
    },
    modalText: {
        color: "#3A312C",
    },
    modalCategory: {
        color: "#C56A47",
        fontWeight: "700",
        textTransform: "capitalize",
    },
});
