import { RawBufferRenderTarget, BufferRenderTargetOptions } from '../../heck/RawBufferRenderTarget';
import { Material } from '../../heck/Material';
import { Quad } from '../../heck/components/Quad';

export function createShaderRenderTarget(
  material: Material,
  options: BufferRenderTargetOptions,
): RawBufferRenderTarget {
  const target = new RawBufferRenderTarget( options );

  const quad = new Quad( {
    material,
    target,
  } );
  quad.drawImmediate();

  return target;
}
