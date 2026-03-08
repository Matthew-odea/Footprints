import {
  acceptFriendRequest,
  addFriend,
  getIncomingFriendRequests,
  getOutgoingFriendRequests,
  listFriends,
  rejectFriendRequest,
  removeFriend,
  searchUsers,
} from '../friends';

// Mock constants
jest.mock('../../lib/constants', () => ({
  API_BASE_URL: 'https://9fal46jhxe.execute-api.us-east-1.amazonaws.com',
}));

// Mock fetch
global.fetch = jest.fn();

describe('friends API client', () => {
  const mockToken = 'mock-token-123';
  const API_BASE_URL = 'https://9fal46jhxe.execute-api.us-east-1.amazonaws.com';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listFriends', () => {
    it('should fetch friends list successfully', async () => {
      const mockResponse = {
        items: [
          { friend_id: '1', username: 'bob', profile: { full_name: 'Bob Smith' } },
          { friend_id: '2', username: 'charlie', profile: { full_name: 'Charlie Brown' } },
        ],
        total: 2,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await listFriends(mockToken);

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/v1/friends`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
      expect(result).toEqual(mockResponse.items);
    });

    it('should throw error when fetch fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
        text: async () => 'Unauthorized',
      });

      await expect(listFriends(mockToken)).rejects.toThrow('Unauthorized');
    });
  });

  describe('searchUsers', () => {
    it('should search users by query', async () => {
      const mockResponse = {
        items: [
          { friend_id: null, username: 'bobby', profile: { full_name: 'Bobby Tables' } },
        ],
        total: 1,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await searchUsers(mockToken, 'bob');

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/v1/friends/search?q=bob`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
      expect(result).toEqual(mockResponse.items);
    });

    it('should encode query parameters correctly', async () => {
      const mockResponse = { items: [], total: 0 };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await searchUsers(mockToken, 'john doe');

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/v1/friends/search?q=john%20doe`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
    });
  });

  describe('addFriend', () => {
    it('should add friend successfully', async () => {
      const mockResponse = {
        friend_id: '123',
        username: 'bob',
        profile: { full_name: 'Bob Smith' },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await addFriend(mockToken, 'bob');

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/v1/friends`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username: 'bob' }),
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle adding duplicate friend', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Conflict',
        text: async () => 'Conflict',
      });

      await expect(addFriend(mockToken, 'bob')).rejects.toThrow('Conflict');
    });
  });

  describe('removeFriend', () => {
    it('should remove friend successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await removeFriend(mockToken, '123');

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/v1/friends/123`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
    });

    it('should handle removing non-existent friend', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
        text: async () => 'Not Found',
      });

      await expect(removeFriend(mockToken, '999')).rejects.toThrow('Not Found');
    });
  });

  describe('friend requests', () => {
    it('should fetch incoming requests', async () => {
      const mockResponse = {
        items: [
          {
            request_id: 'req-1',
            user_id: 'user-2',
            username: 'bob',
            display_name: 'Bob Smith',
            created_at: '2026-03-01T00:00:00Z',
            direction: 'incoming',
          },
        ],
        total: 1,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getIncomingFriendRequests(mockToken);

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/v1/friends/requests/incoming`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
      expect(result).toEqual(mockResponse.items);
    });

    it('should fetch outgoing requests', async () => {
      const mockResponse = {
        items: [
          {
            request_id: 'req-2',
            user_id: 'user-3',
            username: 'charlie',
            display_name: 'Charlie Brown',
            created_at: '2026-03-01T00:00:00Z',
            direction: 'outgoing',
          },
        ],
        total: 1,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getOutgoingFriendRequests(mockToken);

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/v1/friends/requests/outgoing`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
      expect(result).toEqual(mockResponse.items);
    });

    it('should accept an incoming request', async () => {
      const mockResponse = {
        friend_id: 'user-2',
        username: 'bob',
        display_name: 'Bob Smith',
        status: 'accepted',
        accepted_at: '2026-03-01T00:00:00Z',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await acceptFriendRequest(mockToken, 'req-1');

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/v1/friends/requests/req-1/accept`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should reject an incoming request', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await rejectFriendRequest(mockToken, 'req-1');

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/v1/friends/requests/req-1/reject`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
    });
  });
});
