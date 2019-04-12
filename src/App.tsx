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

        console.log(image.width, image.height);
        // 縦に10ピクセルを緑で塗り潰す
        for (let i = 0; i < 10; i++) {
          for (let j = 0; j < image.width * 4; j = j + 4) {
            const index = i * image.width * 4 + j;
            console.log(index);
            imageData.data[index + 0] = 0;
            imageData.data[index + 1] = 255;
            imageData.data[index + 2] = 0;
            imageData.data[index + 3] = 255;
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
