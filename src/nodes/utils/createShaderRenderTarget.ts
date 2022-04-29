import { BufferRenderTarget, BufferRenderTargetOptions } from '../../heck/BufferRenderTarget';
import { Material } from '../../heck/Material';
import { Quad } from '../../heck/components/Quad';

export function createShaderRenderTarget(
  material: Material,
  options: BufferRenderTargetOptions,
): BufferRenderTarget {
  const target = new BufferRenderTarget( options );

  const quad = new Quad( {
    material,
    target,
  } );
  quad.drawImmediate();

  return target;
}
