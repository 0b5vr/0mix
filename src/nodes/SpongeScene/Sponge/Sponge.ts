import { RaymarcherNode } from '../../utils/RaymarcherNode';
import { mengerSpongeFrag } from './shaders/spongeFrag';
import { objectVert } from '../../../shaders/common/objectVert';

export class Sponge extends RaymarcherNode {
  public constructor() {
    super( mengerSpongeFrag );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
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
