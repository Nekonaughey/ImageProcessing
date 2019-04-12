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
        const data = imageData.data;
        console.log(data[0], data[1], data[2], data[3]);
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
