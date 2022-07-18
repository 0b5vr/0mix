import { RANDOM_TEXTURE_SIZE, STATIC_RANDOM_TEXTURE_SIZE } from '../config';
import { RandomTexture } from '../utils/RandomTexture';

export const randomTexture = new RandomTexture(
  RANDOM_TEXTURE_SIZE,
  RANDOM_TEXTURE_SIZE
);
randomTexture.update();

export const randomTextureStatic = new RandomTexture(
  STATIC_RANDOM_TEXTURE_SIZE,
  STATIC_RANDOM_TEXTURE_SIZE
);
randomTextureStatic.update();
