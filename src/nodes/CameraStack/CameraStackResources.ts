import { BufferTextureRenderTarget } from '../../heck/BufferTextureRenderTarget';
import { DenoiserResources, createDenoiserResources, resizeDenoiserResources } from './Denoiser/DenoiserResources';
import { DoFResources, createDoFResources, resizeDoFResources } from './DoF/DoFResources';
import { GLTextureFormatStuffR16F, GLTextureFormatStuffRGBA16F, GLTextureFormatStuffRGBA32F } from '../../gl/glSetTexture';
import { GL_NEAREST } from '../../gl/constants';
import { glTextureFilter } from '../../gl/glTextureFilter';

export type CameraStackResources = [
  deferredTarget: BufferTextureRenderTarget,
  aoTarget?: BufferTextureRenderTarget,
  shadeTarget?: BufferTextureRenderTarget,
  denoiserResources?: DenoiserResources,
  dofResources?: DoFResources,
];

export function createCameraStackResources(
  withAO?: boolean,
  withDenoiser?: boolean,
  withDoF?: boolean,
): CameraStackResources {
  const deferredTarget = new BufferTextureRenderTarget( 4, 4, 4, GLTextureFormatStuffRGBA32F );
  const aoTarget = withAO
    ? new BufferTextureRenderTarget( 4, 4, 1, GLTextureFormatStuffR16F )
    : undefined;
  const shadeTarget = withDoF || withDenoiser
    ? new BufferTextureRenderTarget( 4, 4, 1, GLTextureFormatStuffRGBA16F )
    : undefined;
  const denoiserResources = withDenoiser
    ? createDenoiserResources()
    : undefined;
  const dofResources = withDoF
    ? createDoFResources()
    : undefined;

  deferredTarget.textures.map( ( texture ) => (
    glTextureFilter( texture, GL_NEAREST )
  ) );

  return [ deferredTarget, aoTarget, shadeTarget, denoiserResources, dofResources ];
}

export function resizeCameraStackResources(
  [
    deferredTarget,
    aoTarget,
    shadeTarget,
    denoiserResources,
    dofResources,
  ]: CameraStackResources,
  width: number,
  height: number,
): void {
  deferredTarget.resize( width, height );
  aoTarget?.resize( width, height );
  shadeTarget?.resize( width, height );
  denoiserResources && resizeDenoiserResources( denoiserResources, width, height );
  dofResources && resizeDoFResources( dofResources, width, height );
}
