/**
 * ImgBB Image Upload Utility
 * Free image hosting with CDN - no server load
 * Uses platform's ImgBB API key (NEXT_PUBLIC_IMGBB_API_KEY)
 */

export interface ImgBBResponse {
  success: boolean;
  data?: {
    id: string;
    url: string;
    display_url: string;
    delete_url: string;
    thumb?: {
      url: string;
    };
    medium?: {
      url: string;
    };
  };
  error?: {
    message: string;
    code: number;
  };
}

/**
 * Upload image to ImgBB
 * @param file - File object or base64 string
 * @param name - Optional name for the image
 * @returns ImgBB response with URLs
 */
export async function uploadToImgBB(
  file: File | string,
  name?: string
): Promise<{ success: boolean; url?: string; deleteUrl?: string; error?: string }> {
  const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
  
  if (!apiKey) {
    console.error('ImgBB API key not found in NEXT_PUBLIC_IMGBB_API_KEY');
    return { success: false, error: 'Image upload not configured. Please contact support.' };
  }

  try {
    const formData = new FormData();
    formData.append('key', apiKey);
    
    if (typeof file === 'string') {
      // Base64 string
      formData.append('image', file);
    } else {
      // File object - convert to base64
      const base64 = await fileToBase64(file);
      formData.append('image', base64);
    }
    
    if (name) {
      formData.append('name', name);
    }

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      console.error('ImgBB response not ok:', response.status, response.statusText);
      return { success: false, error: `Upload failed: ${response.statusText}` };
    }

    const result: ImgBBResponse = await response.json();

    if (result.success && result.data) {
      return {
        success: true,
        url: result.data.display_url,
        deleteUrl: result.data.delete_url,
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
      error: error instanceof Error ? error.message : 'Upload failed. Please try again.',
    };
  }
}

/**
 * Convert File to base64 string (without data URL prefix)
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Validate image file before upload
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Please select a valid image (JPG, PNG, GIF, or WebP)' };
  }

  // Check file size (max 2MB for logos)
  const maxSize = 2 * 1024 * 1024; // 2MB
  if (file.size > maxSize) {
    return { valid: false, error: 'Image must be less than 2MB' };
  }

  return { valid: true };
}

// Alias for backward compatibility
export const uploadImageToImgBB = uploadToImgBB;
