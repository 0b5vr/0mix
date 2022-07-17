import { ShaderRenderTarget } from '../nodes/utils/ShaderRenderTarget';
import { perlinFBMFrag } from './shaders/perlinFBMFrag';
import { quadVert } from '../shaders/common/quadVert';

/**
 * Intended to be used in music
 */
export const perlinFBMTextureTarget = new ShaderRenderTarget(
  2048,
  2048,
  perlinFBMFrag,
);

if ( import.meta.env.DEV ) {
  perlinFBMTextureTarget.name = 'perlinFBM';
}

if ( import.meta.hot ) {
  import.meta.hot.accept(
    './shaders/perlinFBMFrag',
    ( { perlinFBMFrag } ) => {
      perlinFBMTextureTarget.material.replaceShader(
        quadVert,
        perlinFBMFrag,
      ).then( () => {
        perlinFBMTextureTarget.quad.drawImmediate();
      } );
    },
  );
}
