import React, { useEffect, useRef } from 'react';
import { changeContrast, noise, grayscale } from './Util';

const cuon = require('./cuon-image');

const App = () => {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const context = canvas.current && canvas.current.getContext('2d');
    if (context) {
      const templateImage = new Image();
      templateImage.onload = () => {
        context.drawImage(templateImage, 0, 0);
        const templateImageData = context.getImageData(0, 0, templateImage.width, templateImage.height);
        const templatePixel = templateImageData.data;

        context.drawImage(templateImage, 0, 0);

        const templateGray = new Uint8ClampedArray(templateImage.width * templateImage.height);
        cuon.toGray(templatePixel, templateGray);

        const targetImage = new Image();
        targetImage.onload = () => {
          context.drawImage(targetImage, 0, 0);

          const targetImageData = context.getImageData(0, 0, targetImage.width, targetImage.height);
          const targetPixel = targetImageData.data;

          const targetGray = new Uint8ClampedArray(targetImage.width * targetImage.height);
          cuon.toGray(targetPixel, targetGray);

          let count = 0;
          for (let templateY = 0; templateY < templateImage.height; templateY += 1) {
            for (let templateX = 0; templateX < templateImage.width; templateX += 1) {
              const index = templateX + templateImage.width * templateY;

              if (targetGray[index] === templateGray[index]) count++;
            }
          }

          console.log(count);
          console.log(templateImage.width * templateImage.height);
          if (count === templateImage.width * templateImage.height) {
            alert('一致した');
          } else {
            alert('不一致');
          }
        };
        targetImage.src = 'template.png';
      };
      templateImage.src = 'template.png';
    }
  }, []);

  return (
    <canvas ref={canvas} width="480" height="320">
      Canvasをサポートしたブラウザを利用してください。
    </canvas>
  );
};

export default App;
