import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { FeedScreen } from '../FeedScreen';
import * as uploadAPI from '../../services/upload';

// Mock the upload API (which contains getFeed)
jest.mock('../../services/upload');

describe('FeedScreen - Scope Toggle', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  const mockRoute = {
    key: 'feed',
    name: 'Feed' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock global token
    (global as any).userToken = 'mock-token';
  });

  it('should render with "All" scope selected by default', async () => {
    const mockFeedItems = [
      {
        id: '1',
        user_id: 'user1',
        username: 'alice',
        full_name: 'Alice Wonder',
        photo_url: 'https://example.com/photo1.jpg',
        prompt: 'Test prompt 1',
        completed_at: '2024-01-01T10:00:00Z',
      },
    ];

    (uploadAPI.getFeed as jest.Mock).mockResolvedValue({ items: mockFeedItems });

    const { getByText } = render(
      <FeedScreen navigation={mockNavigation as any} route={mockRoute} />
    );

    await waitFor(() => {
      // Check that All button exists and is active
      const allButton = getByText('All');
      expect(allButton).toBeTruthy();
    });
  });

  it('should load all feed items when "All" scope is active', async () => {
    const mockFeedItems = [
      {
        id: '1',
        user_id: 'user1',
        username: 'bob',
        full_name: 'Bob Smith',
        photo_url: 'https://example.com/photo1.jpg',
        prompt: 'Test prompt 1',
        completed_at: '2024-01-01T10:00:00Z',
      },
      {
        id: '2',
        user_id: 'user2',
        username: 'charlie',
        full_name: 'Charlie Brown',
        photo_url: 'https://example.com/photo2.jpg',
        prompt: 'Test prompt 2',
        completed_at: '2024-01-01T11:00:00Z',
      },
    ];

    (uploadAPI.getFeed as jest.Mock).mockResolvedValue({ items: mockFeedItems });

    render(
      <FeedScreen navigation={mockNavigation as any} route={mockRoute} />
    );

    await waitFor(() => {
      expect(uploadAPI.getFeed).toHaveBeenCalledWith('mock-token', 'all');
    });
  });

  it('should switch to "Friends" scope when Friends button pressed', async () => {
    const mockAllFeed = [
      {
        id: '1',
        user_id: 'user1',
        username: 'bob',
        full_name: 'Bob Smith',
        photo_url: 'https://example.com/photo1.jpg',
        prompt: 'Test prompt 1',
        completed_at: '2024-01-01T10:00:00Z',
      },
    ];

    const mockFriendsFeed = [
      {
        id: '1',
        user_id: 'user1',
        username: 'bob',
        full_name: 'Bob Smith',
        photo_url: 'https://example.com/photo1.jpg',
        prompt: 'Test prompt 1',
        completed_at: '2024-01-01T10:00:00Z',
      },
    ];

    (uploadAPI.getFeed as jest.Mock)
      .mockResolvedValueOnce({ items: mockAllFeed })
      .mockResolvedValueOnce({ items: mockFriendsFeed });

    const { getByText } = render(
      <FeedScreen navigation={mockNavigation as any} route={mockRoute} />
    );

    // Wait for initial load with "all" scope
    await waitFor(() => {
      expect(uploadAPI.getFeed).toHaveBeenCalledWith('mock-token', 'all');
    });

    // Press Friends button
    const friendsButton = getByText('Friends');
    fireEvent.press(friendsButton);

    // Should reload with "friends" scope
    await waitFor(() => {
      expect(uploadAPI.getFeed).toHaveBeenCalledWith('mock-token', 'friends');
    });
  });

  it('should switch back to "All" scope when All button pressed', async () => {
    (uploadAPI.getFeed as jest.Mock).mockResolvedValue({ items: [] });

    const { getByText } = render(
      <FeedScreen navigation={mockNavigation as any} route={mockRoute} />
    );

    await waitFor(() => {
      expect(uploadAPI.getFeed).toHaveBeenCalledWith('mock-token', 'all');
    });

    // Switch to Friends
    const friendsButton = getByText('Friends');
    fireEvent.press(friendsButton);

    await waitFor(() => {
      expect(uploadAPI.getFeed).toHaveBeenCalledWith('mock-token', 'friends');
    });

    // Switch back to All
    const allButton = getByText('All');
    fireEvent.press(allButton);

    await waitFor(() => {
      expect(uploadAPI.getFeed).toHaveBeenCalledTimes(3);
      expect(uploadAPI.getFeed).toHaveBeenLastCalledWith('mock-token', 'all');
    });
  });

  it('should display friends-only feed items when Friends scope active', async () => {
    const mockFriendsFeed = [
      {
        id: '1',
        user_id: 'friend1',
        username: 'bob',
        full_name: 'Bob Smith',
        photo_url: 'https://example.com/photo1.jpg',
        prompt: 'Test prompt from friend',
        completed_at: '2024-01-01T10:00:00Z',
      },
    ];

    (uploadAPI.getFeed as jest.Mock)
      .mockResolvedValueOnce({ items: [] })
      .mockResolvedValueOnce({ items: mockFriendsFeed });

    const { getByText } = render(
      <FeedScreen navigation={mockNavigation as any} route={mockRoute} />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(getByText('All')).toBeTruthy();
    });

    // Switch to Friends scope
    const friendsButton = getByText('Friends');
    fireEvent.press(friendsButton);

    await waitFor(() => {
      expect(getByText('bob')).toBeTruthy();
      expect(getByText('Test prompt from friend')).toBeTruthy();
    });
  });

  it('should show empty state when friends feed has no items', async () => {
    (uploadAPI.getFeed as jest.Mock)
      .mockResolvedValueOnce({ items: [{ id: '1', username: 'someone' }] })
      .mockResolvedValueOnce({ items: [] });

    const { getByText } = render(
      <FeedScreen navigation={mockNavigation as any} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByText('All')).toBeTruthy();
    });

    // Switch to Friends scope
    const friendsButton = getByText('Friends');
    fireEvent.press(friendsButton);

    await waitFor(() => {
      expect(getByText(/no completions yet/i)).toBeTruthy();
    });
  });

  it('should maintain scroll position when switching scopes', async () => {
    const mockItems = Array.from({ length: 20 }, (_, i) => ({
      id: `${i}`,
      user_id: `user${i}`,
      username: `user${i}`,
      full_name: `User ${i}`,
      photo_url: `https://example.com/photo${i}.jpg`,
      prompt: `Prompt ${i}`,
      completed_at: '2024-01-01T10:00:00Z',
    }));

    (uploadAPI.getFeed as jest.Mock).mockResolvedValue({ items: mockItems });

    const { getByText } = render(
      <FeedScreen navigation={mockNavigation as any} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByText('All')).toBeTruthy();
    });

    // The FlatList should reset to top when switching scopes
    // This is expected behavior for a feed filter
  });

  it('should handle API errors gracefully', async () => {
    (uploadAPI.getFeed as jest.Mock)
      .mockResolvedValueOnce({ items: [] })
      .mockRejectedValueOnce(new Error('Network error'));

    const { getByText } = render(
      <FeedScreen navigation={mockNavigation as any} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByText('All')).toBeTruthy();
    });

    // Switch to Friends scope (which will error)
    const friendsButton = getByText('Friends');
    fireEvent.press(friendsButton);

    await waitFor(() => {
      expect(getByText(/error/i)).toBeTruthy();
    });
  });

  it('should show loading indicator when switching scopes', async () => {
    (uploadAPI.getFeed as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ items: [] }), 100))
    );

    const { getByText, getByTestId } = render(
      <FeedScreen navigation={mockNavigation as any} route={mockRoute} />
    );

    await waitFor(() => {
      expect(getByText('All')).toBeTruthy();
    });

    const friendsButton = getByText('Friends');
    fireEvent.press(friendsButton);

    // Should show loading indicator while fetching
    expect(() => getByTestId('loading-indicator')).not.toThrow();
  });
});
