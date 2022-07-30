import { BufferTextureRenderTarget } from '../../heck/BufferTextureRenderTarget';
import { DoFResources, createDoFResources, resizeDoFResources } from './DoF/DoFResources';
import { GLTextureFormatStuffR16F, GLTextureFormatStuffRGBA16F, GLTextureFormatStuffRGBA32F } from '../../gl/glSetTexture';
import { GL_NEAREST } from '../../gl/constants';
import { glTextureFilter } from '../../gl/glTextureFilter';

export type CameraStackResources = [
  deferredTarget: BufferTextureRenderTarget,
  aoTarget?: BufferTextureRenderTarget,
  preDoFTarget?: BufferTextureRenderTarget,
  dofResources?: DoFResources,
];

export function createCameraStackResources(
  withAO?: boolean,
  withDoF?: boolean,
): CameraStackResources {
  const deferredTarget = new BufferTextureRenderTarget( 4, 4, 4, GLTextureFormatStuffRGBA32F );
  const aoTarget = withAO
    ? new BufferTextureRenderTarget( 4, 4, 1, GLTextureFormatStuffR16F )
    : undefined;
  const preDoFTarget = withDoF
    ? new BufferTextureRenderTarget( 4, 4, 1, GLTextureFormatStuffRGBA16F )
    : undefined;
  const dofResources = withDoF
    ? createDoFResources()
    : undefined;

  deferredTarget.textures.map( ( texture ) => (
    glTextureFilter( texture, GL_NEAREST )
  ) );

  return [ deferredTarget, aoTarget, preDoFTarget, dofResources ];
}

export function resizeCameraStackResources(
  resources: CameraStackResources,
  width: number,
  height: number,
): void {
  resources[ 0 ].resize( width, height );
  resources[ 1 ]?.resize( width, height );
  resources[ 2 ]?.resize( width, height );

  resources[ 3 ] && resizeDoFResources( resources[ 3 ], width, height );
}
