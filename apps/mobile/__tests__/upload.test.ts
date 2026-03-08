/**
 * Tests for the upload service (S3 upload and feed fetching)
 */

import {
  requestUploadUrl,
  uploadPhotoToS3,
  getFeed,
  type UploadUrlResponse,
  type FeedResponse,
} from '../src/services/upload';

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn(),
}));

describe('Upload Service', () => {
  const mockToken = 'test-token-123';
  const mockAPI = 'https://9fal46jhxe.execute-api.us-east-1.amazonaws.com';

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    // Mock fetch globally
    global.fetch = jest.fn();
  });

  describe('requestUploadUrl', () => {
    it('should request a presigned upload URL successfully', async () => {
      const mockResponse: UploadUrlResponse = {
        upload_url: 'https://footprints-dev-completions.s3.amazonaws.com/',
        upload_fields: {
          key: 'completions/test-user/abc-123.jpeg',
          policy: 'eyJleH...',
          signature: 'sig...',
          AWSAccessKeyId: 'AKIA...',
        },
        s3_key: 'completions/test-user/abc-123.jpeg',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await requestUploadUrl(mockToken, 'image/jpeg');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockAPI}/api/v1/uploads`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`,
          }),
        })
      );
    });

    it('should throw an error if the request fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
      });

      await expect(requestUploadUrl(mockToken, 'image/jpeg')).rejects.toThrow(
        'Upload URL request failed'
      );
    });

    it('should handle different image file types', async () => {
      const validFileTypes = ['image/jpeg', 'image/png', 'image/webp'];

      for (const fileType of validFileTypes) {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            upload_url: 'https://s3.amazonaws.com/',
            upload_fields: {},
            s3_key: `completions/user/${fileType}.ext`,
          }),
        });

        const result = await requestUploadUrl(mockToken, fileType);

        expect(result.upload_fields).toBeDefined();
      }
    });
  });

  describe('uploadPhotoToS3', () => {
    it('should upload a photo to S3 successfully', async () => {
      const mockFileSystem = require('expo-file-system');
      const mockLocalUri = 'file:///path/to/photo.jpg';
      const mockBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      mockFileSystem.readAsStringAsync.mockResolvedValueOnce(mockBase64);

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          blob: async () => new Blob([Buffer.from(mockBase64, 'base64')]),
        })
        .mockResolvedValueOnce({
          ok: true,
        });

      const uploadUrl = 'https://footprints-dev-completions.s3.amazonaws.com/';
      const uploadFields = {
        key: 'completions/user/photo.jpg',
        policy: 'policy',
        signature: 'sig',
      };

      await expect(
        uploadPhotoToS3(uploadUrl, uploadFields, mockLocalUri)
      ).resolves.not.toThrow();

      expect(mockFileSystem.readAsStringAsync).toHaveBeenCalledWith(
        mockLocalUri,
        expect.objectContaining({ encoding: 'base64' })
      );
    });

    it('should throw an error if S3 upload fails', async () => {
      const mockFileSystem = require('expo-file-system');
      const mockLocalUri = 'file:///path/to/photo.jpg';
      const mockBase64 = 'base64data';

      mockFileSystem.readAsStringAsync.mockResolvedValueOnce(mockBase64);

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          blob: async () => new Blob(),
        })
        .mockResolvedValueOnce({
          ok: false,
          statusText: 'Upload failed',
        });

      await expect(
        uploadPhotoToS3(
          'https://s3.amazonaws.com/',
          { key: 'test.jpg' },
          mockLocalUri
        )
      ).rejects.toThrow('S3 upload failed');
    });
  });

  describe('getFeed', () => {
    it('should fetch feed items successfully', async () => {
      const mockFeedResponse: FeedResponse = {
        items: [
          {
            completion_id: 'comp-1',
            user_id: 'user-1',
            user_display_name: 'Test User',
            prompt_id: 'prompt-1',
            prompt_title: 'Morning Run',
            photo_url: 's3://bucket/photo.jpg',
            note: 'Great run!',
            location: 'Park',
            date: '2026-03-08',
            created_at: '2026-03-08T10:00:00Z',
          },
        ],
        next_cursor: null,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFeedResponse,
      });

      const result = await getFeed(mockToken, 20);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].user_display_name).toBe('Test User');
      expect(result.items[0].note).toBe('Great run!');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/feed'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
          }),
        })
      );
    });

    it('should support pagination with cursor', async () => {
      const mockCursor = 'next-page-cursor';
      const mockFeedResponse: FeedResponse = {
        items: [],
        next_cursor: null,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFeedResponse,
      });

      await getFeed(mockToken, 20, mockCursor);

      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain('cursor=');
    });

    it('should handle feed with custom limit', async () => {
      const mockFeedResponse: FeedResponse = {
        items: [],
        next_cursor: null,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFeedResponse,
      });

      await getFeed(mockToken, 50);

      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain('limit=50');
    });

    it('should throw an error if feed request fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
      });

      await expect(getFeed(mockToken, 20)).rejects.toThrow('Feed request failed');
    });

    it('should return empty feed gracefully', async () => {
      const mockFeedResponse: FeedResponse = {
        items: [],
        next_cursor: null,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFeedResponse,
      });

      const result = await getFeed(mockToken);

      expect(result.items).toHaveLength(0);
      expect(result.next_cursor).toBeNull();
    });
  });
});
