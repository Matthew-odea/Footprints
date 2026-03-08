import { useMemo, useState, useEffect, useRef } from "react";
import {
    FlatList,
    Image,
    PanResponder,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    View,
} from "react-native";

import { getArchiveCompletions, getFavoriteCompletions } from "../services/api";
import { useAuth } from "../state/AuthContext";
import { CompletionItem } from "../types/api";
import { Title, Heading, Body, Button, Card, VStack, HStack, LoadingSpinner, EmptyState } from "../components";
import { theme } from "../theme";

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
            {/* Header + View Mode Toggle */}
            <VStack space="md" style={styles.headerRow}>
                <Title>Archive</Title>
                <HStack space="sm">
                    <Button
                        label="Calendar"
                        onPress={() => setViewMode("calendar")}
                        variant={viewMode === "calendar" ? "primary" : "outline"}
                        flex={1}
                        size="sm"
                    />
                    <Button
                        label="Timeline"
                        onPress={() => setViewMode("timeline")}
                        variant={viewMode === "timeline" ? "primary" : "outline"}
                        flex={1}
                        size="sm"
                    />
                    <Button
                        label="Favorites"
                        onPress={() => setViewMode("favorites")}
                        variant={viewMode === "favorites" ? "primary" : "outline"}
                        flex={1}
                        size="sm"
                    />
                </HStack>
            </VStack>

            {/* Loading State */}
            {loading ? <LoadingSpinner message="Loading..." /> : null}

            {/* Error State */}
            {error ? <Body style={{ color: theme.colors.error, marginHorizontal: theme.spacing.base }}>{error}</Body> : null}

            {/* Calendar View */}
            {viewMode === "calendar" ? (
                <View style={styles.calendarContainer} {...monthSwipeResponder.panHandlers}>
                    {/* Month Navigation */}
                    <HStack justify="space-between" align="center" style={styles.monthNavRow}>
                        <Button label="‹" onPress={onPreviousMonth} variant="outline" size="sm" />
                        <Body style={styles.monthLabel}>{monthLabel(currentMonth)}</Body>
                        <Button label="›" onPress={onNextMonth} variant="outline" size="sm" />
                    </HStack>

                    {/* Day Headers */}
                    <HStack style={styles.dayHeaderRow}>
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                            <Body key={day} style={styles.dayHeaderText}>
                                {day}
                            </Body>
                        ))}
                    </HStack>

                    {/* Calendar Grid */}
                    <View style={styles.grid}>
                        {monthCells.map((cell) => {
                            const completion = dateToCompletion.get(cell.dateKey);
                            const isSelected = selectedDate === cell.dateKey;
                            return (
                                <Button
                                    key={cell.dateKey}
                                    label={completion?.photo_url ? "" : String(cell.date.getDate())}
                                    onPress={() => onCalendarDayPress(completion ? cell.dateKey : "")}
                                    disabled={!completion}
                                    variant={isSelected ? "primary" : "outline"}
                                    style={[
                                        styles.calendarCell,
                                        !cell.inCurrentMonth && styles.outsideCell,
                                    ]}
                                >
                                    {completion?.photo_url ? (
                                        <Image source={{ uri: completion.photo_url }} style={styles.thumbnail} />
                                    ) : null}
                                </Button>
                            );
                        })}
                    </View>

                    {/* Timeline List Below Calendar */}
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
                            <Card
                                padding="md"
                                style={styles.timelineCard}
                                onPress={() => navigation.navigate('EntryDetail', { completionId: item.completion_id })}
                            >
                                <VStack space="sm">
                                    <Heading>{item.prompt_title}</Heading>
                                    <HStack space="md">
                                        {item.date && <Body>📅 {item.date}</Body>}
                                        {item.location && <Body>📍 {item.location}</Body>}
                                    </HStack>
                                    {item.note && <Body style={{ color: theme.colors.textSecondary }}>{item.note}</Body>}
                                </VStack>
                            </Card>
                        )}
                        ListEmptyComponent={
                            <EmptyState
                                icon="📭"
                                title="No entries this month"
                                subtitle="No completions recorded in this period."
                            />
                        }
                        contentContainerStyle={styles.timelineList}
                    />
                </View>
            ) : viewMode === "timeline" ? (
                <FlatList
                    data={allTimelineItems}
                    keyExtractor={(item) => item.completion_id}
                    numColumns={2}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    renderItem={({ item }) => (
                        <Button
                            style={styles.galleryCell}
                            onPress={() => navigation.navigate('EntryDetail', { completionId: item.completion_id })}
                            variant="ghost"
                        >
                            {item.photo_url ? (
                                <Image source={{ uri: item.photo_url }} style={styles.galleryImage} />
                            ) : (
                                <View style={styles.galleryImageFallback}>
                                    <Body style={{ color: theme.colors.textSecondary }}>No Photo</Body>
                                </View>
                            )}
                            <View style={styles.galleryMeta}>
                                <Body style={styles.galleryDate}>{item.date}</Body>
                                {item.category ? <Body style={styles.galleryCategory}>{item.category}</Body> : null}
                                <Body numberOfLines={1} style={styles.galleryPrompt}>{item.prompt_title}</Body>
                            </View>
                        </Button>
                    )}
                    ListEmptyComponent={
                        <EmptyState
                            icon="📸"
                            title="No timeline items yet"
                            subtitle="Your completions will appear here."
                        />
                    }
                    contentContainerStyle={styles.galleryList}
                    onEndReachedThreshold={0.6}
                    onEndReached={loadMoreTimeline}
                    ListFooterComponent={loadingMore ? <LoadingSpinner message="" /> : null}
                />
            ) : viewMode === "favorites" ? (
                <FlatList
                    data={favoriteItems}
                    keyExtractor={(item) => item.completion_id}
                    numColumns={2}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    renderItem={({ item }) => (
                        <Button
                            style={styles.galleryCell}
                            onPress={() => navigation.navigate('EntryDetail', { completionId: item.completion_id })}
                            variant="ghost"
                        >
                            {item.photo_url ? (
                                <Image source={{ uri: item.photo_url }} style={styles.galleryImage} />
                            ) : (
                                <View style={styles.galleryImageFallback}>
                                    <Body style={{ color: theme.colors.textSecondary }}>No Photo</Body>
                                </View>
                            )}
                            <View style={styles.galleryMeta}>
                                <Body style={styles.galleryDate}>{item.date}</Body>
                                {item.category ? <Body style={styles.galleryCategory}>{item.category}</Body> : null}
                                <Body numberOfLines={1} style={styles.galleryPrompt}>{item.prompt_title}</Body>
                            </View>
                        </Button>
                    )}
                    ListEmptyComponent={
                        <EmptyState
                            icon="🤍"
                            title="No favorites yet"
                            subtitle="Tap the heart icon on entries to save them here."
                        />
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
        backgroundColor: theme.colors.background,
    },
    headerRow: {
        paddingHorizontal: theme.spacing.base,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    calendarContainer: {
        flex: 1,
    },
    monthNavRow: {
        paddingHorizontal: theme.spacing.base,
        paddingVertical: theme.spacing.md,
    },
    monthLabel: {
        fontSize: 18,
        fontWeight: "700",
    },
    dayHeaderRow: {
        flexDirection: "row",
        paddingHorizontal: theme.spacing.base,
        marginBottom: theme.spacing.sm,
    },
    dayHeaderText: {
        flex: 1,
        textAlign: "center",
        color: theme.colors.textSecondary,
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        paddingHorizontal: theme.spacing.base,
        gap: theme.spacing.sm,
        paddingBottom: theme.spacing.md,
    },
    calendarCell: {
        width: "14.2857%",
        aspectRatio: 1,
    },
    outsideCell: {
        opacity: 0.4,
    },
    thumbnail: {
        width: "100%",
        height: "100%",
        borderRadius: theme.radius.base,
    },
    timelineList: {
        paddingHorizontal: theme.spacing.base,
        paddingVertical: theme.spacing.md,
        gap: theme.spacing.md,
    },
    timelineCard: {
        marginHorizontal: 0,
    },
    galleryList: {
        paddingHorizontal: theme.spacing.xs,
        paddingVertical: theme.spacing.md,
    },
    galleryCell: {
        width: "50%",
        paddingHorizontal: theme.spacing.xs,
        paddingVertical: theme.spacing.xs,
        marginBottom: 0,
    },
    galleryImage: {
        width: "100%",
        aspectRatio: 1,
        borderRadius: theme.radius.base,
        backgroundColor: theme.colors.border,
    },
    galleryImageFallback: {
        width: "100%",
        aspectRatio: 1,
        borderRadius: theme.radius.base,
        backgroundColor: theme.colors.border,
        alignItems: "center",
        justifyContent: "center",
    },
    galleryMeta: {
        position: "absolute",
        left: theme.spacing.sm,
        right: theme.spacing.sm,
        bottom: theme.spacing.sm,
        backgroundColor: "rgba(0,0,0,0.5)",
        borderRadius: theme.radius.base,
        paddingHorizontal: theme.spacing.xs,
        paddingVertical: theme.spacing.xs,
    },
    galleryDate: {
        color: "#FFF",
        fontWeight: "700",
    },
    galleryCategory: {
        color: theme.colors.secondary,
        fontWeight: "700",
        textTransform: "uppercase",
    },
    galleryPrompt: {
        color: "#FFF",
    },
});
