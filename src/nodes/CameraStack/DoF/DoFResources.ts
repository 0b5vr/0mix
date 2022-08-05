import { BufferTextureRenderTarget } from '../../../heck/BufferTextureRenderTarget';
import { GLTextureFormatStuffR11G11B10F, GLTextureFormatStuffRG16F, GLTextureFormatStuffRGBA16F } from '../../../gl/glSetTexture';
import { GL_NEAREST } from '../../../gl/constants';
import { glTextureFilter } from '../../../gl/glTextureFilter';

export type DoFResources = [
  targetTileMaxH: BufferTextureRenderTarget,
  targetTileMaxV: BufferTextureRenderTarget,
  targetTileGather: BufferTextureRenderTarget,
  targetPresort: BufferTextureRenderTarget,
  targetBlur: BufferTextureRenderTarget,
];

export function createDoFResources(): DoFResources {
  const targetTileMaxH = new BufferTextureRenderTarget( 4, 4, 1, GLTextureFormatStuffRG16F );
  const targetTileMaxV = new BufferTextureRenderTarget( 4, 4, 1, GLTextureFormatStuffRG16F );
  const targetTileGather = new BufferTextureRenderTarget( 4, 4, 1, GLTextureFormatStuffRG16F );
  const targetPresort = new BufferTextureRenderTarget( 4, 4, 1, GLTextureFormatStuffR11G11B10F );
  const targetBlur = new BufferTextureRenderTarget( 4, 4, 1, GLTextureFormatStuffRGBA16F );

  glTextureFilter( targetTileMaxH.texture, GL_NEAREST );
  glTextureFilter( targetTileMaxV.texture, GL_NEAREST );
  glTextureFilter( targetTileGather.texture, GL_NEAREST );

  if ( import.meta.env.DEV ) {
    targetTileMaxH.name = 'DoF/TileMaxH';
    targetTileMaxV.name = 'DoF/TileMaxV';
    targetTileGather.name = 'DoF/TileGather';
    targetPresort.name = 'DoF/Presort';
    targetBlur.name = 'DoF/Blur';
  }

  return [
    targetTileMaxH,
    targetTileMaxV,
    targetTileGather,
    targetPresort,
    targetBlur,
  ];
}

export function resizeDoFResources( resources: DoFResources, width: number, height: number ): void {
  resources[ 0 ].resize( width / 16, height );
  resources[ 1 ].resize( width / 16, height / 16 );
  resources[ 2 ].resize( width / 16, height / 16 );
  resources[ 3 ].resize( width, height );
  resources[ 4 ].resize( width, height );
}
