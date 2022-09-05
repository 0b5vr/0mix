import { BufferTextureRenderTarget } from '../../heck/BufferTextureRenderTarget';
import { DoFResources, createDoFResources, resizeDoFResources } from './DoF/DoFResources';
import { GLTextureFormatStuffR16F, GLTextureFormatStuffRGBA16F, GLTextureFormatStuffRGBA32F } from '../../gl/glSetTexture';
import { GL_NEAREST } from '../../gl/constants';
import { Swap } from '@0b5vr/experimental';
import { glTextureFilter } from '../../gl/glTextureFilter';

export type CameraStackResources = [
  deferredTarget: BufferTextureRenderTarget,
  aoTarget?: BufferTextureRenderTarget,
  aoDenoiserSwap?: Swap<BufferTextureRenderTarget>,
  shadeTarget?: BufferTextureRenderTarget,
  denoiserSwap?: Swap<BufferTextureRenderTarget>,
  dofResources?: DoFResources,
];

export function createCameraStackResources(
  withAO?: boolean,
  withDenoiser?: boolean,
  withDoF?: boolean,
): CameraStackResources {
  const deferredTarget = new BufferTextureRenderTarget( 4, 4, 4, GLTextureFormatStuffRGBA32F );
  deferredTarget.textures.map( ( texture ) => (
    glTextureFilter( texture, GL_NEAREST )
  ) );

  const aoTarget = withAO
    ? new BufferTextureRenderTarget( 4, 4, 1, GLTextureFormatStuffR16F )
    : undefined;

  const aoDenoiserSwap = withDenoiser ? new Swap(
    new BufferTextureRenderTarget( 4, 4, 1, GLTextureFormatStuffR16F ),
    new BufferTextureRenderTarget( 4, 4, 1, GLTextureFormatStuffR16F ),
  ) : undefined;
  if ( aoDenoiserSwap ) {
    glTextureFilter( aoDenoiserSwap.i.texture, GL_NEAREST );
    glTextureFilter( aoDenoiserSwap.o.texture, GL_NEAREST );
  }

  const shadeTarget = withDoF || withDenoiser
    ? new BufferTextureRenderTarget( 4, 4, 1, GLTextureFormatStuffRGBA16F )
    : undefined;

  const denoiserSwap = withDenoiser ? new Swap(
    new BufferTextureRenderTarget( 4, 4, 1, GLTextureFormatStuffRGBA16F ),
    new BufferTextureRenderTarget( 4, 4, 1, GLTextureFormatStuffRGBA16F ),
  ) : undefined;
  if ( denoiserSwap ) {
    glTextureFilter( denoiserSwap.i.texture, GL_NEAREST );
    glTextureFilter( denoiserSwap.o.texture, GL_NEAREST );
  }

  const dofResources = withDoF
    ? createDoFResources()
    : undefined;

  return [ deferredTarget, aoTarget, aoDenoiserSwap, shadeTarget, denoiserSwap, dofResources ];
}

export function resizeCameraStackResources(
  [
    deferredTarget,
    aoTarget,
    aoDenoiserSwap,
    shadeTarget,
    denoiserSwap,
    dofResources,
  ]: CameraStackResources,
  width: number,
  height: number,
): void {
  deferredTarget.resize( width, height );
  aoTarget?.resize( width, height );
  aoDenoiserSwap?.i.resize( width, height );
  aoDenoiserSwap?.o.resize( width, height );
  shadeTarget?.resize( width, height );
  denoiserSwap?.i.resize( width, height );
  denoiserSwap?.o.resize( width, height );
  dofResources && resizeDoFResources( dofResources, width, height );
}
