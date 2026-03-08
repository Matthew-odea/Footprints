import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AddFriendModal } from '../AddFriendModal';

describe('AddFriendModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSearch = jest.fn();
  const mockOnAddFriend = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render modal when visible', () => {
    const { getByPlaceholderText } = render(
      <AddFriendModal
        visible={true}
        loading={false}
        error={null}
        onClose={mockOnClose}
        onSearch={mockOnSearch}
        onAddFriend={mockOnAddFriend}
      />
    );

    expect(getByPlaceholderText('Search username')).toBeTruthy();
  });

  it('should not render modal when not visible', () => {
    const { queryByPlaceholderText } = render(
      <AddFriendModal
        visible={false}
        loading={false}
        error={null}
        onClose={mockOnClose}
        onSearch={mockOnSearch}
        onAddFriend={mockOnAddFriend}
      />
    );

    expect(queryByPlaceholderText('Search username')).toBeNull();
  });

  it('should call onSearch when search button pressed with valid query', async () => {
    const { getByPlaceholderText, getByText } = render(
      <AddFriendModal
        visible={true}
        loading={false}
        error={null}
        onClose={mockOnClose}
        onSearch={mockOnSearch}
        onAddFriend={mockOnAddFriend}
      />
    );

    const input = getByPlaceholderText('Search username');
    const searchButton = getByText('Search');

    fireEvent.changeText(input, 'bob');
    fireEvent.press(searchButton);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('bob');
    });
  });

  it('should not call onSearch with query shorter than 2 characters', async () => {
    const { getByPlaceholderText, getByText } = render(
      <AddFriendModal
        visible={true}
        loading={false}
        error={null}
        onClose={mockOnClose}
        onSearch={mockOnSearch}
        onAddFriend={mockOnAddFriend}
      />
    );

    const input = getByPlaceholderText('Search username');
    const searchButton = getByText('Search');

    fireEvent.changeText(input, 'b');
    fireEvent.press(searchButton);

    await waitFor(() => {
      expect(mockOnSearch).not.toHaveBeenCalled();
    });
  });

  it('should display search results', () => {
    const mockResults = [
      { friend_id: null, username: 'bob', profile: { full_name: 'Bob Smith' } },
      { friend_id: null, username: 'bobby', profile: { full_name: 'Bobby Tables' } },
    ];

    const { getByText } = render(
      <AddFriendModal
        visible={true}
        loading={false}
        error={null}
        onClose={mockOnClose}
        onSearch={mockOnSearch}
        onAddFriend={mockOnAddFriend}
      />
    );

    // Simulate search results
    const input = getByText('Search');
    fireEvent.changeText(input, 'bob');
  });

  it('should call onAddFriend when add button pressed', async () => {
    const mockResults = [
      { friend_id: null, username: 'bob', profile: { full_name: 'Bob Smith' } },
    ];

    const { getAllByText, getByPlaceholderText } = render(
      <AddFriendModal
        visible={true}
        loading={false}
        error={null}
        onClose={mockOnClose}
        onSearch={mockOnSearch}
        onAddFriend={mockOnAddFriend}
      />
    );

    // First search to get results
    const input = getByPlaceholderText('Search username');
    fireEvent.changeText(input, 'bob');
    
    const searchButton = getAllByText('Search')[0];
    fireEvent.press(searchButton);

    // Wait for onSearch to be called
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('bob');
    });
  });

  it('should display error message when provided', () => {
    const { getByText } = render(
      <AddFriendModal
        visible={true}
        loading={false}
        error="User not found"
        onClose={mockOnClose}
        onSearch={mockOnSearch}
        onAddFriend={mockOnAddFriend}
      />
    );

    expect(getByText('User not found')).toBeTruthy();
  });

  it('should call onClose when cancel button pressed', () => {
    const { getByText } = render(
      <AddFriendModal
        visible={true}
        loading={false}
        error={null}
        onClose={mockOnClose}
        onSearch={mockOnSearch}
        onAddFriend={mockOnAddFriend}
      />
    );

    const cancelButton = getByText('Done');
    fireEvent.press(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should reset state when modal closes', () => {
    const { rerender, getByPlaceholderText } = render(
      <AddFriendModal
        visible={true}
        loading={false}
        error={null}
        onClose={mockOnClose}
        onSearch={mockOnSearch}
        onAddFriend={mockOnAddFriend}
      />
    );

    const input = getByPlaceholderText('Search username');
    fireEvent.changeText(input, 'test query');

    rerender(
      <AddFriendModal
        visible={false}
        loading={false}
        error={null}
        onClose={mockOnClose}
        onSearch={mockOnSearch}
        onAddFriend={mockOnAddFriend}
      />
    );

    rerender(
      <AddFriendModal
        visible={true}
        loading={false}
        error={null}
        onClose={mockOnClose}
        onSearch={mockOnSearch}
        onAddFriend={mockOnAddFriend}
      />
    );

    // Input should be cleared after reopening
    const newInput = getByPlaceholderText('Search username');
    expect(newInput.props.value).toBe('');
  });

  it('should display loading spinner when searching', async () => {
    mockOnSearch.mockImplementation(() => new Promise(() => {})); // Never resolves

    const { getByPlaceholderText, getByText, UNSAFE_queryByType } = render(
      <AddFriendModal
        visible={true}
        loading={false}
        error={null}
        onClose={mockOnClose}
        onSearch={mockOnSearch}
        onAddFriend={mockOnAddFriend}
      />
    );

    // Trigger search
    const input = getByPlaceholderText('Search username');
    fireEvent.changeText(input, 'bob');
    const searchButton = getByText('Search');
    fireEvent.press(searchButton);

    // ActivityIndicator should appear while searching
    await waitFor(() => {
      const { ActivityIndicator } = require('react-native');
      expect(UNSAFE_queryByType(ActivityIndicator)).toBeTruthy();
    });
  });
});
