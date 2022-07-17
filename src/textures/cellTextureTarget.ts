import { ShaderRenderTarget } from '../nodes/utils/ShaderRenderTarget';
import { cellFrag } from './shaders/cellFrag';
import { quadVert } from '../shaders/common/quadVert';

/**
 * sex
 */
export const cellTextureTarget = new ShaderRenderTarget(
  2048,
  2048,
  cellFrag,
);

if ( import.meta.env.DEV ) {
  cellTextureTarget.name = 'cell';
}

if ( import.meta.hot ) {
  import.meta.hot.accept(
    './shaders/cellFrag',
    ( { cellFrag } ) => {
      cellTextureTarget.material.replaceShader(
        quadVert,
        cellFrag,
      ).then( () => {
        cellTextureTarget.quad.drawImmediate();
      } );
    },
  );
}
