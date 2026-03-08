// Photo upload service for S3 and API interactions.

import * as FileSystem from "expo-file-system";
import { API_BASE_URL } from "../lib/constants";

export interface UploadUrlResponse {
  upload_url: string;
  upload_fields: Record<string, string>;
  s3_key: string;
}

export interface FeedItem {
  completion_id: string;
  user_id: string;
  user_display_name: string;
  prompt_id: string;
  prompt_title: string;
  photo_url: string;
  note: string;
  location: string;
  date: string;
  created_at: string;
}

export interface FeedResponse {
  items: FeedItem[];
  next_cursor?: string;
}

export async function requestUploadUrl(
  token: string,
  fileType: string
): Promise<UploadUrlResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/uploads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ file_type: fileType }),
  });

  if (!response.ok) {
    throw new Error(`Upload URL request failed: ${response.statusText}`);
  }

  return response.json();
}

export async function uploadPhotoToS3(
  uploadUrl: string,
  uploadFields: Record<string, string>,
  localUri: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  // Read file as base64
  const base64Data = await FileSystem.readAsStringAsync(localUri, {
    encoding: "base64",
  });

  // Convert to blob
  const response = await fetch(
    `data:image/jpeg;base64,${base64Data}`
  );
  const blob = await response.blob();

  // Create FormData
  const formData = new FormData();

  // Add all presigned POST fields
  Object.entries(uploadFields).forEach(([key, value]) => {
    formData.append(key, value as any);
  });

  // Add file
  formData.append("file", blob, "photo.jpg");

  // Upload to S3
  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
  });

  if (!uploadResponse.ok) {
    throw new Error(`S3 upload failed: ${uploadResponse.statusText}`);
  }
}

export async function getFeed(
  token: string,
  limit: number = 20,
  cursor?: string
): Promise<FeedResponse> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    ...(cursor && { cursor }),
  });

  const response = await fetch(`${API_BASE_URL}/api/v1/feed?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Feed request failed: ${response.statusText}`);
  }

  return response.json();
}
