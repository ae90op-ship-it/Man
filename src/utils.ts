/**
 * Compresses and resizes a Base64 image or File using HTML5 Canvas to fit within a max width/height.
 * This ensures base64 data strings fit comfortably inside localStorage without exceeding quota.
 */
export function compressAndResizeImage(file: File, maxWidth = 800, maxHeight = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate responsive scale
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string); // fallback to original if context fails
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Use JPEG with 0.7 compression ratio for high performance vs size
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        resolve(compressedBase64);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

/**
 * Generate a random unique ID.
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}
