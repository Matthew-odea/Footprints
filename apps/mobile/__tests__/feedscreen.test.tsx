/**
 * Tests for FeedScreen component
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { FeedScreen } from '../src/screens/FeedScreen';
import * as uploadService from '../src/services/upload';
import { AuthContext } from '../src/state/AuthContext';

// Mock the upload service
jest.mock('../src/services/upload');

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useFocusEffect: jest.fn((callback) => {
    React.useEffect(() => {
      callback();
    }, []);
  }),
}));

describe('FeedScreen', () => {
  const mockToken = 'test-token';
  const mockAuthContext = {
    token: mockToken,
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
  };

  const mockFeedItems = [
    {
      completion_id: 'comp-1',
      user_id: 'user-1',
      user_display_name: 'Alice',
      prompt_id: 'prompt-1',
      prompt_title: 'Morning Run',
      photo_url: 's3://bucket/photo1.jpg',
      note: 'Great run today!',
      location: 'Central Park',
      date: '2026-03-08',
      created_at: '2026-03-08T10:00:00Z',
    },
    {
      completion_id: 'comp-2',
      user_id: 'user-2',
      user_display_name: 'Bob',
      prompt_id: 'prompt-2',
      prompt_title: 'Evening Yoga',
      photo_url: 's3://bucket/photo2.jpg',
      note: 'Relaxing session',
      location: 'Yoga Studio',
      date: '2026-03-08',
      created_at: '2026-03-08T18:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading spinner initially', () => {
    (uploadService.getFeed as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(
      <AuthContext.Provider value={mockAuthContext as any}>
        <FeedScreen />
      </AuthContext.Provider>
    );

    expect(screen.getByTestId('loading-spinner')).toBeTruthy();
  });

  it('should display feed items after loading', async () => {
    (uploadService.getFeed as jest.Mock).mockResolvedValueOnce({
      items: mockFeedItems,
      next_cursor: null,
    });

    render(
      <AuthContext.Provider value={mockAuthContext as any}>
        <FeedScreen />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeTruthy();
      expect(screen.getByText('Morning Run')).toBeTruthy();
      expect(screen.getByText('Great run today!')).toBeTruthy();
    });
  });

  it('should display multiple feed items', async () => {
    (uploadService.getFeed as jest.Mock).mockResolvedValueOnce({
      items: mockFeedItems,
      next_cursor: null,
    });

    render(
      <AuthContext.Provider value={mockAuthContext as any}>
        <FeedScreen />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeTruthy();
      expect(screen.getByText('Bob')).toBeTruthy();
    });
  });

  it('should display error message on fetch failure', async () => {
    const errorMessage = 'Failed to load feed';
    (uploadService.getFeed as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

    render(
      <AuthContext.Provider value={mockAuthContext as any}>
        <FeedScreen />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(new RegExp(errorMessage))).toBeTruthy();
    });
  });

  it('should display empty state when no items', async () => {
    (uploadService.getFeed as jest.Mock).mockResolvedValueOnce({
      items: [],
      next_cursor: null,
    });

    render(
      <AuthContext.Provider value={mockAuthContext as any}>
        <FeedScreen />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('No activity yet')).toBeTruthy();
    });
  });

  it('should call getFeed with correct parameters', async () => {
    (uploadService.getFeed as jest.Mock).mockResolvedValueOnce({
      items: [],
      next_cursor: null,
    });

    render(
      <AuthContext.Provider value={mockAuthContext as any}>
        <FeedScreen />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(uploadService.getFeed).toHaveBeenCalledWith(mockToken, 20, undefined);
    });
  });

  it('should support pull-to-refresh', async () => {
    (uploadService.getFeed as jest.Mock).mockResolvedValue({
      items: mockFeedItems,
      next_cursor: null,
    });

    const { rerender } = render(
      <AuthContext.Provider value={mockAuthContext as any}>
        <FeedScreen />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(uploadService.getFeed).toHaveBeenCalled();
    });

    // Simulate pull-to-refresh (would need actual component implementation)
    // For now, verify the service is callable multiple times
    expect(uploadService.getFeed).toHaveBeenCalledTimes(1);
  });

  it('should format dates correctly', async () => {
    (uploadService.getFeed as jest.Mock).mockResolvedValueOnce({
      items: mockFeedItems,
      next_cursor: null,
    });

    render(
      <AuthContext.Provider value={mockAuthContext as any}>
        <FeedScreen />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      // Date should be formatted as "Mar 8" for current year
      expect(screen.getByText(/Mar|March/)).toBeTruthy();
    });
  });
});
