'use server';

/**
 * Server-side image upload to ImgBB
 * Keeps API key secure on server
 */

interface ImgBBResponse {
  success: boolean;
  data?: {
    id: string;
    url: string;
    display_url: string;
    delete_url: string;
  };
  error?: {
    message: string;
    code: number;
  };
}

/**
 * Upload image to ImgBB via server action
 * @param base64Image - Base64 encoded image (with or without data URL prefix)
 * @param name - Optional name for the image
 */
export async function uploadImageAction(
  base64Image: string,
  name?: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  const apiKey = process.env.IMGBB_API_KEY;
  
  if (!apiKey) {
    console.error('IMGBB_API_KEY not found in environment');
    return { success: false, error: 'Image upload not configured' };
  }

  try {
    // Remove data URL prefix if present
    const base64Data = base64Image.includes(',') 
      ? base64Image.split(',')[1] 
      : base64Image;

    const formData = new FormData();
    formData.append('key', apiKey);
    formData.append('image', base64Data);
    
    if (name) {
      formData.append('name', name);
    }

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      console.error('ImgBB response error:', response.status, response.statusText);
      return { success: false, error: `Upload failed: ${response.statusText}` };
    }

    const result: ImgBBResponse = await response.json();

    if (result.success && result.data) {
      return {
        success: true,
        url: result.data.display_url,
      };
    } else {
      console.error('ImgBB upload failed:', result.error);
      return {
        success: false,
        error: result.error?.message || 'Upload failed',
      };
    }
  } catch (error) {
    console.error('ImgBB upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}
