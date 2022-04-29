import { RANDOM_RESOLUTION, STATIC_RANDOM_RESOLUTION } from '../config';
import { RandomTexture } from '../utils/RandomTexture';

export const randomTexture = new RandomTexture(
  RANDOM_RESOLUTION[ 0 ],
  RANDOM_RESOLUTION[ 1 ]
);
randomTexture.update();

export const randomTextureStatic = new RandomTexture(
  STATIC_RANDOM_RESOLUTION[ 0 ],
  STATIC_RANDOM_RESOLUTION[ 1 ]
);
randomTextureStatic.update();
