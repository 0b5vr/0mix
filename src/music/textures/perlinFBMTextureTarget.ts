import { ShaderRenderTarget } from '../../nodes/utils/ShaderRenderTarget';
import { quadVert } from '../../shaders/common/quadVert';
import { perlinFBMFrag } from './shaders/perlinFBMFrag';

/**
 * Intended to be used in music
 */
export const perlinFBMTextureTarget = new ShaderRenderTarget(
  2048,
  2048,
  perlinFBMFrag,
);

if ( import.meta.env.DEV ) {
  perlinFBMTextureTarget.name = 'TextureBakery/perlinFBM';
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
