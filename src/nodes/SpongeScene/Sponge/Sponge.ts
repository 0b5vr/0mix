import { RaymarcherNode } from '../../utils/RaymarcherNode';
import { genCube } from '../../../geometries/genCube';
import { objectVert } from '../../../shaders/common/objectVert';
import { spongeFrag } from './shaders/spongeFrag';

export class Sponge extends RaymarcherNode {
  public constructor() {
    const geometry = genCube();

    super( spongeFrag, { geometry } );

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
