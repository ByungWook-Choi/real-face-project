// src/utils/imageProcessing.js

export const applyPincushionDistortion = (imageDataUrl, strength = 0.5) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      const distortedPixels = ctx.createImageData(canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const dx = x - centerX;
          const dy = y - centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);

          // Apply pincushion distortion formula
          let distortedDistance;
          if (strength >= 0) {
            // Pincushion effect (pulls pixels towards center)
            distortedDistance = distance * (1 - strength * (distance / maxRadius));
          } else {
            // Barrel effect (pushes pixels outwards from center)
            distortedDistance = distance / (1 + strength * (distance / maxRadius));
          }
          
          // Ensure distorted distance is within bounds
          if (distortedDistance < 0) distortedDistance = 0;
          if (distortedDistance > maxRadius) distortedDistance = maxRadius;


          const sourceX = Math.floor(centerX + distortedDistance * Math.cos(angle));
          const sourceY = Math.floor(centerY + distortedDistance * Math.sin(angle));

          if (sourceX >= 0 && sourceX < canvas.width && sourceY >= 0 && sourceY < canvas.height) {
            const destIndex = (y * canvas.width + x) * 4;
            const srcIndex = (sourceY * canvas.width + sourceX) * 4;

            distortedPixels.data[destIndex] = pixels[srcIndex];
            distortedPixels.data[destIndex + 1] = pixels[srcIndex + 1];
            distortedPixels.data[destIndex + 2] = pixels[srcIndex + 2];
            distortedPixels.data[destIndex + 3] = pixels[srcIndex + 3];
          } else {
            // Fill with transparent if outside source bounds
            const destIndex = (y * canvas.width + x) * 4;
            distortedPixels.data[destIndex] = 0;
            distortedPixels.data[destIndex + 1] = 0;
            distortedPixels.data[destIndex + 2] = 0;
            distortedPixels.data[destIndex + 3] = 0;
          }
        }
      }

      ctx.putImageData(distortedPixels, 0, 0);
      resolve(canvas.toDataURL());
    };
    img.src = imageDataUrl;
  });
};