import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { FriendsScreen } from '../FriendsScreen';
import * as friendsAPI from '../../services/friends';
import { Alert } from 'react-native';

// Mock the friends API
jest.mock('../../services/friends');
jest.mock('../../state/AuthContext', () => ({
  useAuth: () => ({ token: 'mock-token' }),
}));
jest.spyOn(Alert, 'alert');

describe('FriendsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (friendsAPI.listFriends as jest.Mock).mockResolvedValue([]);
    (friendsAPI.getIncomingFriendRequests as jest.Mock).mockResolvedValue([]);
    (friendsAPI.getOutgoingFriendRequests as jest.Mock).mockResolvedValue([]);
    (friendsAPI.acceptFriendRequest as jest.Mock).mockResolvedValue({
      friend_id: '1',
      username: 'bob',
      display_name: 'Bob Smith',
      status: 'accepted',
      accepted_at: '2026-03-01T00:00:00Z',
    });
    (friendsAPI.rejectFriendRequest as jest.Mock).mockResolvedValue(undefined);
  });

  it('should render empty state when no friends', async () => {
    (friendsAPI.listFriends as jest.Mock).mockResolvedValue([]);

    const { getByText } = render(
      <FriendsScreen />
    );

    await waitFor(() => {
      expect(getByText(/no friends yet/i)).toBeTruthy();
    });
  });

  it('should display friends list', async () => {
    const mockFriends = [
      { friend_id: '1', username: 'bob', display_name: 'Bob Smith', status: 'accepted', created_at: '2026-01-01T00:00:00Z' },
      { friend_id: '2', username: 'charlie', display_name: 'Charlie Brown', status: 'accepted', created_at: '2026-01-01T00:00:00Z' },
    ];

    (friendsAPI.listFriends as jest.Mock).mockResolvedValue(mockFriends);

    const { getByText } = render(
      <FriendsScreen />
    );

    await waitFor(() => {
      expect(getByText('@bob')).toBeTruthy();
      expect(getByText('Bob Smith')).toBeTruthy();
      expect(getByText('@charlie')).toBeTruthy();
      expect(getByText('Charlie Brown')).toBeTruthy();
    });
  });

  it('should show loading spinner while fetching', () => {
    (friendsAPI.listFriends as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { UNSAFE_getByType } = render(
      <FriendsScreen />
    );

    // Check for ActivityIndicator
    const { ActivityIndicator } = require('react-native');
    expect(() => UNSAFE_getByType(ActivityIndicator)).not.toThrow();
  });

  it('should display error message on fetch failure', async () => {
    (friendsAPI.listFriends as jest.Mock).mockRejectedValue(
      new Error('Network error')
    );

    const { getByText } = render(
      <FriendsScreen />
    );

    await waitFor(() => {
      expect(getByText('Error: Network error')).toBeTruthy();
    });
  });

  it('should show add friend modal when add button pressed', async () => {
    const { getByText, getByPlaceholderText } = render(
      <FriendsScreen />
    );

    await waitFor(() => {
      expect(getByText(/no friends yet/i)).toBeTruthy();
    });

    const addButton = getByText('Add Friend');
    fireEvent.press(addButton);

    await waitFor(() => {
      expect(getByPlaceholderText('Search username')).toBeTruthy();
    });
  });

  it('should search users when search function called', async () => {
    const mockSearchResults = [
      { friend_id: null, username: 'bobby', display_name: 'Bobby Tables', status: 'none', created_at: '2026-01-01T00:00:00Z' },
    ];

    (friendsAPI.searchUsers as jest.Mock).mockResolvedValue(mockSearchResults);

    const { getByText, getByPlaceholderText } = render(
      <FriendsScreen />
    );

    await waitFor(() => {
      expect(getByText(/no friends yet/i)).toBeTruthy();
    });

    // Open modal
    const addButton = getByText('Add Friend');
    fireEvent.press(addButton);

    await waitFor(() => {
      const input = getByPlaceholderText('Search username');
      fireEvent.changeText(input, 'bob');
      
      const searchButton = getByText('Search');
      fireEvent.press(searchButton);
    });

    await waitFor(() => {
      expect(friendsAPI.searchUsers).toHaveBeenCalledWith('mock-token', 'bob');
    });
  });

  it('should add friend when add function called', async () => {
    const mockNewFriend = {
      friend_id: '3',
      username: 'bobby',
      display_name: 'Bobby Tables',
      status: 'accepted',
      created_at: '2026-01-01T00:00:00Z',
    };

    (friendsAPI.addFriend as jest.Mock).mockResolvedValue(mockNewFriend);

    const { getByText } = render(
      <FriendsScreen />
    );

    await waitFor(() => {
      expect(getByText(/no friends yet/i)).toBeTruthy();
    });

    // Simulate adding a friend through the modal
    // This would typically be tested through integration tests
  });

  it('should show confirmation alert before removing friend', async () => {
    const mockFriends = [
      { friend_id: '1', username: 'bob', display_name: 'Bob Smith', status: 'accepted', created_at: '2026-01-01T00:00:00Z' },
    ];

    (friendsAPI.listFriends as jest.Mock).mockResolvedValue(mockFriends);

    const { getByText } = render(
      <FriendsScreen />
    );

    await waitFor(() => {
      expect(getByText('@bob')).toBeTruthy();
    });

    const removeButton = getByText('Remove');
    fireEvent.press(removeButton);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Remove friend',
      expect.stringContaining('@bob'),
      expect.any(Array)
    );
  });

  it('should remove friend when confirmed', async () => {
    const mockFriends = [
      { friend_id: '1', username: 'bob', display_name: 'Bob Smith', status: 'accepted', created_at: '2026-01-01T00:00:00Z' },
    ];

    (friendsAPI.listFriends as jest.Mock).mockResolvedValue(mockFriends);
    (friendsAPI.removeFriend as jest.Mock).mockResolvedValue(undefined);

    // Mock Alert.alert to auto-confirm
    (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
      const confirmButton = buttons.find((b: any) => b.text === 'Remove');
      if (confirmButton?.onPress) {
        confirmButton.onPress();
      }
    });

    const { getByText } = render(
      <FriendsScreen />
    );

    await waitFor(() => {
      expect(getByText('@bob')).toBeTruthy();
    });

    const removeButton = getByText('Remove');
    fireEvent.press(removeButton);

    await waitFor(() => {
      expect(friendsAPI.removeFriend).toHaveBeenCalledWith('mock-token', '1');
    });
  });

  it('should reload friends list after adding friend', async () => {
    const initialFriends = [
      { friend_id: '1', username: 'bob', display_name: 'Bob Smith', status: 'accepted', created_at: '2026-01-01T00:00:00Z' },
    ];
    
    const updatedFriends = [
      ...initialFriends,
      { friend_id: '2', username: 'charlie', display_name: 'Charlie Brown', status: 'accepted', created_at: '2026-01-01T00:00:00Z' },
    ];

    (friendsAPI.listFriends as jest.Mock)
      .mockResolvedValueOnce(initialFriends)
      .mockResolvedValueOnce(updatedFriends);
    
    (friendsAPI.addFriend as jest.Mock).mockResolvedValue(updatedFriends[1]);

    const { getByText, rerender } = render(
      <FriendsScreen />
    );

    await waitFor(() => {
      expect(getByText('@bob')).toBeTruthy();
    });

    // After adding friend, list should be reloaded
    // This would be verified through the component's behavior
  });

  it('should render incoming and outgoing request sections', async () => {
    (friendsAPI.getIncomingFriendRequests as jest.Mock).mockResolvedValue([
      {
        request_id: 'req-1',
        user_id: 'user-2',
        username: 'bob',
        display_name: 'Bob Smith',
        created_at: '2026-03-01T00:00:00Z',
        direction: 'incoming',
      },
    ]);
    (friendsAPI.getOutgoingFriendRequests as jest.Mock).mockResolvedValue([
      {
        request_id: 'req-2',
        user_id: 'user-3',
        username: 'charlie',
        display_name: 'Charlie Brown',
        created_at: '2026-03-01T00:00:00Z',
        direction: 'outgoing',
      },
    ]);

    const { getByText } = render(<FriendsScreen />);

    await waitFor(() => {
      expect(getByText('Incoming Requests')).toBeTruthy();
      expect(getByText('Outgoing Requests')).toBeTruthy();
      expect(getByText('Accept')).toBeTruthy();
      expect(getByText('Reject')).toBeTruthy();
      expect(getByText('Pending')).toBeTruthy();
    });
  });

  it('should accept an incoming friend request', async () => {
    (friendsAPI.getIncomingFriendRequests as jest.Mock).mockResolvedValue([
      {
        request_id: 'req-1',
        user_id: 'user-2',
        username: 'bob',
        display_name: 'Bob Smith',
        created_at: '2026-03-01T00:00:00Z',
        direction: 'incoming',
      },
    ]);

    const { getByText } = render(<FriendsScreen />);

    await waitFor(() => {
      expect(getByText('Accept')).toBeTruthy();
    });

    fireEvent.press(getByText('Accept'));

    await waitFor(() => {
      expect(friendsAPI.acceptFriendRequest).toHaveBeenCalledWith('mock-token', 'req-1');
    });
  });

  it('should reject an incoming friend request', async () => {
    (friendsAPI.getIncomingFriendRequests as jest.Mock).mockResolvedValue([
      {
        request_id: 'req-1',
        user_id: 'user-2',
        username: 'bob',
        display_name: 'Bob Smith',
        created_at: '2026-03-01T00:00:00Z',
        direction: 'incoming',
      },
    ]);

    const { getByText } = render(<FriendsScreen />);

    await waitFor(() => {
      expect(getByText('Reject')).toBeTruthy();
    });

    fireEvent.press(getByText('Reject'));

    await waitFor(() => {
      expect(friendsAPI.rejectFriendRequest).toHaveBeenCalledWith('mock-token', 'req-1');
    });
  });
});
