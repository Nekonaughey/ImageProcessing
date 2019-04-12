export const changeContrast = (
  context: CanvasRenderingContext2D,
  imageData: ImageData,
  intensity: number,
  x: number,
  y: number,
  width: number,
  height: number
): ImageData => {
  const pixel = imageData.data;
  const result = context.createImageData(imageData);

  for (let i = 0; i < imageData.height; i += 1) {
    for (let j = 0; j < imageData.width; j += 1) {
      const index = i * imageData.width * 4 + j * 4;

      if (y <= i && i < y + height && x <= j && j < x + width) {
        result.data[index + 0] = (pixel[index + 0] - 128) * intensity + 128;
        result.data[index + 1] = (pixel[index + 1] - 128) * intensity + 128;
        result.data[index + 2] = (pixel[index + 2] - 128) * intensity + 128;
        result.data[index + 3] = (pixel[index + 3] - 128) * intensity + 128;
      } else {
        result.data[index + 0] = pixel[index + 0];
        result.data[index + 1] = pixel[index + 1];
        result.data[index + 2] = pixel[index + 2];
        result.data[index + 3] = pixel[index + 3];
      }
    }
  }

  return result;
};

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

export const noise = (context: CanvasRenderingContext2D, imageData: ImageData): ImageData => {
  const pixel = imageData.data;
  const result = context.createImageData(imageData);

  for (let x = 0; x < imageData.height; x += 1) {
    for (let y = 0; y < imageData.width; y += 1) {
      const index = x * imageData.width * 4 + y * 4;

      const random = Math.floor(Math.random() * 7) - 3;
      const sourceX = clamp(x + random, 0, imageData.width - 1);
      const sourceY = clamp(y + random, 0, imageData.height - 1);
      const sourceIndex = sourceX * imageData.width * 4 + sourceY * 4;

      result.data[index + 0] = pixel[sourceIndex + 0];
      result.data[index + 1] = pixel[sourceIndex + 1];
      result.data[index + 2] = pixel[sourceIndex + 2];
      result.data[index + 3] = pixel[sourceIndex + 3];
    }
  }

  return result;
};

export const grayscale = (context: CanvasRenderingContext2D, imageData: ImageData): ImageData => {
  const pixel = imageData.data;
  const gray = new Uint8ClampedArray(imageData.width * imageData.height);

  const result = context.createImageData(imageData);
  for (let x = 0; x < imageData.height; x += 1) {
    for (let y = 0; y < imageData.width; y += 1) {
      const index = x * imageData.width * 4 + y * 4;

      gray[index / 4] = 0.3 * pixel[index + 0] + 0.59 * pixel[index + 1] + 0.11 * pixel[index + 2];

      result.data[index + 0] = gray[index / 4];
      result.data[index + 1] = gray[index / 4];
      result.data[index + 2] = gray[index / 4];
      result.data[index + 3] = pixel[index + 3];
    }
  }

  return result;
};
