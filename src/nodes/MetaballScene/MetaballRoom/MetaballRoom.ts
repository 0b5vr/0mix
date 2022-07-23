import { GL_FRONT } from '../../../gl/constants';
import { MTL_PBR_ROUGHNESS_METALLIC } from '../../CameraStack/deferredConstants';
import { Material } from '../../../heck/Material';
import { Mesh } from '../../../heck/components/Mesh';
import { PI } from '../../../utils/constants';
import { SceneNode } from '../../../heck/components/SceneNode';
import { dummyRenderTarget4 } from '../../../globals/dummyRenderTarget';
import { genCube } from '../../../geometries/genCube';
import { metaballRoomFrag } from './shaders/metaballRoomFrag';
import { objectVert } from '../../../shaders/common/objectVert';
import { quatRotationY } from '@0b5vr/experimental';

export class MetaballRoom extends SceneNode {
  public constructor() {
    super();

    // -- geometry ---------------------------------------------------------------------------------
    const { geometry } = genCube( { flipNormal: true } );

    // -- material ---------------------------------------------------------------------------------
    const deferred = new Material(
      objectVert,
      metaballRoomFrag,
      {
        initOptions: { geometry, target: dummyRenderTarget4 },
      },
    );

    deferred.addUniform( 'color', '4f', 0.1, 0.1, 0.1, 1.0 );
    deferred.addUniform( 'mtlKind', '1f', MTL_PBR_ROUGHNESS_METALLIC );
    deferred.addUniform( 'mtlParams', '4f', 0.9, 0.0, 0.0, 0.0 );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        './shaders/metaballRoomFrag',
        ( { metaballRoomFrag } ) => {
          deferred.replaceShader( undefined, metaballRoomFrag );
        },
      );
    }

    // -- mesh -------------------------------------------------------------------------------------
    const mesh = new Mesh( {
      geometry,
      materials: { deferred },
    } );
    mesh.cull = GL_FRONT;

    // -- children ---------------------------------------------------------------------------------
    this.children = [ mesh ];
    this.transform.scale = [ 5.0, 5.0, 5.0 ];
    this.transform.rotation = quatRotationY( PI / 4.0 );
  }
}
