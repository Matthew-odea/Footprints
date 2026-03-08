import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { FeedScreen } from "../FeedScreen";
import * as uploadAPI from "../../services/upload";

jest.mock("../../services/upload");
jest.mock("../../state/AuthContext", () => ({
  useAuth: () => ({ token: "mock-token" }),
}));

const baseFeedItem = {
  completion_id: "comp-1",
  user_id: "user-1",
  user_username: "alice",
  user_display_name: "Alice Wonder",
  prompt_id: "prompt-1",
  prompt_title: "Plant a tree",
  photo_url: "https://example.com/photo.jpg",
  note: "Nice day",
  location: "Park",
  date: "2026-03-01",
  created_at: "2026-03-01T12:00:00Z",
};

describe("FeedScreen - Scope Toggle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads with all scope by default", async () => {
    (uploadAPI.getFeed as jest.Mock).mockResolvedValue({ items: [baseFeedItem], next_cursor: null });

    const { getByText } = render(<FeedScreen />);

    await waitFor(() => {
      expect(uploadAPI.getFeed).toHaveBeenCalledWith("mock-token", 20, undefined, "all");
    });

    expect(getByText("All")).toBeTruthy();
    expect(getByText("Alice Wonder")).toBeTruthy();
    expect(getByText("Plant a tree")).toBeTruthy();
  });

  it("switches to friends scope", async () => {
    (uploadAPI.getFeed as jest.Mock)
      .mockResolvedValueOnce({ items: [baseFeedItem], next_cursor: null })
      .mockResolvedValueOnce({
        items: [{ ...baseFeedItem, completion_id: "comp-2", user_display_name: "Bob Friend" }],
        next_cursor: null,
      });

    const { getByText } = render(<FeedScreen />);

    await waitFor(() => {
      expect(uploadAPI.getFeed).toHaveBeenCalledWith("mock-token", 20, undefined, "all");
    });

    fireEvent.press(getByText("Friends"));

    await waitFor(() => {
      expect(uploadAPI.getFeed).toHaveBeenCalledWith("mock-token", 20, undefined, "friends");
    });

    expect(getByText("Bob Friend")).toBeTruthy();
  });

  it("shows empty state when no items", async () => {
    (uploadAPI.getFeed as jest.Mock).mockResolvedValue({ items: [], next_cursor: null });

    const { getByText } = render(<FeedScreen />);

    await waitFor(() => {
      expect(getByText("No activity yet")).toBeTruthy();
    });
  });

  it("shows error when scope fetch fails", async () => {
    (uploadAPI.getFeed as jest.Mock)
      .mockResolvedValueOnce({ items: [baseFeedItem], next_cursor: null })
      .mockRejectedValueOnce(new Error("Network error"));

    const { getByText } = render(<FeedScreen />);

    await waitFor(() => {
      expect(getByText("All")).toBeTruthy();
    });

    fireEvent.press(getByText("Friends"));

    await waitFor(() => {
      expect(getByText(/network error/i)).toBeTruthy();
    });
  });
});
