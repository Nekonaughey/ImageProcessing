import React, { useEffect, useRef } from 'react';

const App = () => {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const context = canvas.current && canvas.current.getContext('2d');
    if (context) {
      const image = new Image();
      image.onload = () => {
        context.drawImage(image, 0, 0);
        const imageData = context.getImageData(0, 0, image.width, image.height);

        const pixel = imageData.data;

        // 画面全体のコントラストを変更する。
        const intensity = 0.2;
        for (let i = 40; i < 70; i++) {
          for (let j = 50; j < 180; j++) {
            const index = i * image.width * 4 + j * 4;
            pixel[index + 0] = (pixel[index + 0] - 128) * intensity + 128;
            pixel[index + 1] = (pixel[index + 1] - 128) * intensity + 128;
            pixel[index + 2] = (pixel[index + 2] - 128) * intensity + 128;
          }
        }
        context.putImageData(imageData, 0, 0);
      };
      image.src = 'sky.png';
    }
  }, []);
  return (
    <canvas ref={canvas} width="480" height="320">
      Canvasをサポートしたブラウザを利用してください。
    </canvas>
  );
};

export default App;
