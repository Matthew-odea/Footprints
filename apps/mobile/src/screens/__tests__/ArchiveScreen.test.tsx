import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { ArchiveScreen } from "../ArchiveScreen";
import * as api from "../../services/api";

jest.mock("../../services/api");
jest.mock("../../state/AuthContext", () => ({
    useAuth: () => ({ token: "mock-token" }),
}));

describe("ArchiveScreen", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2026-03-15T12:00:00.000Z"));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("loads calendar month data by default", async () => {
        (api.getArchiveCompletions as jest.Mock).mockResolvedValue([
            {
                completion_id: "c1",
                prompt_id: "p1",
                prompt_title: "Plant a tree",
                note: "Great day",
                date: "2026-03-10",
                location: "Park",
                photo_url: "https://example.com/1.jpg",
                share_with_friends: true,
            },
        ]);

        const { getByText } = render(<ArchiveScreen />);

        await waitFor(() => {
            expect(api.getArchiveCompletions).toHaveBeenCalledWith(
                "mock-token",
                "2026-03-01",
                "2026-03-31",
                100,
                0
            );
        });

        expect(getByText("Archive")).toBeTruthy();
        expect(getByText("March 2026")).toBeTruthy();
    });

    it("switches to timeline mode and loads paginated timeline", async () => {
        (api.getArchiveCompletions as jest.Mock)
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([
                {
                    completion_id: "c2",
                    prompt_id: "p2",
                    prompt_title: "Run 30 min",
                    category: "wellbeing",
                    note: "Felt strong",
                    date: "2026-03-12",
                    location: "Harbor",
                    photo_url: "",
                    share_with_friends: true,
                },
            ]);

        const { getByText } = render(<ArchiveScreen />);

        await waitFor(() => {
            expect(api.getArchiveCompletions).toHaveBeenCalledWith(
                "mock-token",
                "2026-03-01",
                "2026-03-31",
                100,
                0
            );
        });

        fireEvent.press(getByText("Timeline"));

        await waitFor(() => {
            expect(api.getArchiveCompletions).toHaveBeenCalledWith(
                "mock-token",
                "1900-01-01",
                "2100-12-31",
                20,
                0
            );
        });

        expect(getByText("Run 30 min")).toBeTruthy();
        expect(getByText("wellbeing")).toBeTruthy();
    });

    it("navigates month with previous/next controls", async () => {
        (api.getArchiveCompletions as jest.Mock).mockResolvedValue([]);

        const { getByText } = render(<ArchiveScreen />);

        await waitFor(() => {
            expect(api.getArchiveCompletions).toHaveBeenCalledTimes(1);
        });

        fireEvent.press(getByText("›"));

        await waitFor(() => {
            expect(api.getArchiveCompletions).toHaveBeenCalledWith(
                "mock-token",
                "2026-04-01",
                "2026-04-30",
                100,
                0
            );
        });

        fireEvent.press(getByText("‹"));

        await waitFor(() => {
            expect(api.getArchiveCompletions).toHaveBeenCalledWith(
                "mock-token",
                "2026-03-01",
                "2026-03-31",
                100,
                0
            );
        });
    });
});
