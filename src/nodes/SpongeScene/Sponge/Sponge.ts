import { RaymarcherNode } from '../../utils/RaymarcherNode';
import { spongeFrag } from './shaders/spongeFrag';
import { objectVert } from '../../../shaders/common/objectVert';

export class Sponge extends RaymarcherNode {
  public constructor() {
    super( spongeFrag );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        './shaders/spongeFrag',
        ( { spongeFrag } ) => {
          const { deferred, depth } = this.materials;

          deferred.replaceShader( objectVert, spongeFrag( 'deferred' ) );
          depth.replaceShader( objectVert, spongeFrag( 'depth' ) );
        },
      );
    }
  }
}
