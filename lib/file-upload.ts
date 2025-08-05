"use client";

import { v4 as uuidv4 } from "uuid";

import { getSupabaseClient } from "@/lib/supabase";

const supabase = getSupabaseClient();

export interface UploadedFile {
  name: string;
  url: string;
  type: string;
  size: number;
  path: string; // Added path to the interface
}

/**
 * Uploads a file to Supabase Storage.
 * If a locationId is provided, it also saves metadata to the database.
 * @param file The file to upload.
 * @param locationId The optional ID of the location to associate the file with.
 * @returns The URL of the uploaded file.
 */
export async function uploadFile(file: File): Promise<UploadedFile> {
  try {
    const bucketName = "travel-files";

    // New approach: Generate a completely safe file path
    const fileExt = file.name.slice(file.name.lastIndexOf("."));
    const safeFilePath = `${uuidv4()}${fileExt}`;

    // 1. Upload the file to Supabase Storage with the safe path
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(safeFilePath, file);

    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      throw new Error(`File upload failed: ${uploadError.message}`);
    }

    // 2. Get the public URL using the safe path
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(safeFilePath);

    if (!urlData || !urlData.publicUrl) {
      throw new Error("Failed to get public URL for the uploaded file.");
    }

    const publicUrl = urlData.publicUrl;

    const uploadedFileData: UploadedFile = {
      name: file.name, // The original file name
      path: safeFilePath, // The new, safe path used in storage
      url: publicUrl,
      type: file.type,
      size: file.size,
    };

    return uploadedFileData;
  } catch (error) {
    console.error("An unexpected error occurred during file upload:", error);
    throw error;
  }
}
