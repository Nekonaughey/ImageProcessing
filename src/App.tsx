import React, { useEffect, useRef } from 'react';
import { changeContrast, noise, grayscale } from './Util';

const cuon = require('./cuon-image');

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

        console.log(cuon);
        const gray = new Uint8ClampedArray(image.width * image.height);
        cuon.toGray(pixel, gray);
        cuon.drawGrayImage(gray, 0, 0, context, imageData);
        // const result = changeContrast(context, imageData, 0.2, 50, 40, 130, 30);
        // const result = noise(context, imageData);
        // const result = grayscale(context, imageData);
        // context.putImageData(result, 0, 0);
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
