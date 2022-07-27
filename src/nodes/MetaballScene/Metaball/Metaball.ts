import { RaymarcherNode } from '../../utils/RaymarcherNode';
import { createLightUniformsLambda } from '../../utils/createLightUniformsLambda';
import { genOctahedron } from '../../../geometries/genOctahedron';
import { metaballFrag } from './shaders/metaballFrag';
import { objectVert } from '../../../shaders/common/objectVert';

export class Metaball extends RaymarcherNode {
  public constructor() {
    const geometry = genOctahedron( 3 );

    super( metaballFrag, { geometry } );

    this.children.unshift( createLightUniformsLambda( [ this.materials.deferred ] ) );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        './shaders/metaballFrag',
        ( { metaballFrag } ) => {
          const { deferred, depth } = this.materials;

          deferred.replaceShader( objectVert, metaballFrag( 'deferred' ) );
          depth.replaceShader( objectVert, metaballFrag( 'depth' ) );
        },
      );
    }
  }
}
