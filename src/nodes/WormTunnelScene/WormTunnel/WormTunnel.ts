import { RaymarcherNode } from '../../utils/RaymarcherNode';
import { wormTunnelFrag } from './shaders/wormTunnelFrag';
import { objectVert } from '../../../shaders/common/objectVert';
import { genCylinder } from '../../../geometries/genCylinder';
import { GL_TEXTURE_2D } from '../../../gl/constants';
import { cellTextureTarget } from '../../../textures/cellTextureTarget';

export class WormTunnel extends RaymarcherNode {
  public constructor() {
    const { geometry } = genCylinder( {
      height: -100.0,
      radius: 0.1,
    } );

    super( wormTunnelFrag, { geometry } );

    this.materials.deferred.addUniformTextures(
      'sampler0',
      GL_TEXTURE_2D,
      cellTextureTarget.texture,
    );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        './shaders/wormTunnelFrag',
        ( { wormTunnelFrag } ) => {
          const { deferred, depth } = this.materials;

          deferred.replaceShader( objectVert, wormTunnelFrag( 'deferred' ) );
          depth.replaceShader( objectVert, wormTunnelFrag( 'depth' ) );
        },
      );
    }
  }
}
