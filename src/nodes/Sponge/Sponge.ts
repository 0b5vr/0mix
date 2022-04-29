import { RaymarcherNode } from '../utils/RaymarcherNode';
import { mengerSpongeFrag } from './shaders/spongeFrag';
import { objectVert } from '../../shaders/common/objectVert';

export class Sponge extends RaymarcherNode {
  public constructor() {
    super( mengerSpongeFrag );

    this.transform.position[ 1 ] = 3.0;
    this.transform.scale = [ 3.0, 3.0, 3.0 ];

    if ( import.meta.env.DEV ) {
      import.meta.hot?.accept(
        './shaders/spongeFrag',
        ( { mengerSpongeFrag } ) => {
          const { deferred, depth } = this.materials;

          deferred.replaceShader( objectVert, mengerSpongeFrag( 'deferred' ) );
          depth.replaceShader( objectVert, mengerSpongeFrag( 'depth' ) );
        },
      );
    }
  }
}
