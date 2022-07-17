import { GL_NONE, GL_TRIANGLE_STRIP } from '../../gl/constants';
import { Geometry } from '../../heck/Geometry';
import { Lambda } from '../../heck/components/Lambda';
import { Material } from '../../heck/Material';
import { Mesh } from '../../heck/components/Mesh';
import { RawVector3, TRIANGLE_STRIP_QUAD_3D, TRIANGLE_STRIP_QUAD_NORMAL, TRIANGLE_STRIP_QUAD_UV, quatFromAxisAngle, vecNormalize } from '@0b5vr/experimental';
import { SceneNode, SceneNodeOptions } from '../../heck/components/SceneNode';
import { dummyRenderTarget1 } from '../../globals/dummyRenderTarget';
import { glCreateVertexbuffer } from '../../gl/glCreateVertexbuffer';
import { glVertexArrayBindVertexbuffer } from '../../gl/glVertexArrayBindVertexbuffer';
import { objectVert } from '../../shaders/common/objectVert';
import { uvFrag } from '../../shaders/common/uvFrag';

export class Plane extends SceneNode {
  public constructor( options?: SceneNodeOptions ) {
    super( options );

    // -- geometry ---------------------------------------------------------------------------------
    const bufferPos = glCreateVertexbuffer( new Float32Array( TRIANGLE_STRIP_QUAD_3D ) );
    const bufferNormal = glCreateVertexbuffer( new Float32Array( TRIANGLE_STRIP_QUAD_NORMAL ) );
    const bufferUv = glCreateVertexbuffer( new Float32Array( TRIANGLE_STRIP_QUAD_UV ) );

    const geometry = new Geometry();

    glVertexArrayBindVertexbuffer( geometry.vao, bufferPos, 0, 3 );
    glVertexArrayBindVertexbuffer( geometry.vao, bufferNormal, 1, 3 );
    glVertexArrayBindVertexbuffer( geometry.vao, bufferUv, 2, 2 );

    geometry.count = 4;
    geometry.mode = GL_TRIANGLE_STRIP;

    // -- material ---------------------------------------------------------------------------------
    const forward = new Material(
      objectVert,
      uvFrag,
      {
        initOptions: { geometry, target: dummyRenderTarget1 },
      },
    );
    forward.addUniform( 'color', '4f', 1.0, 1.0, 1.0, 1.0 );

    const materials = { forward };

    // -- mesh -------------------------------------------------------------------------------------
    const mesh = new Mesh( { geometry, materials } );
    mesh.cull = GL_NONE;

    // -- speen ------------------------------------------------------------------------------------
    const speenAxis = vecNormalize( [ 0.0, 1.0, 0.0 ] ) as RawVector3;

    const lambdaSpeen = new Lambda( {
      onUpdate: ( { time } ) => {
        this.transform.rotation = quatFromAxisAngle( speenAxis, time );
      },
    } );

    if ( import.meta.env.DEV ) {
      lambdaSpeen.name = 'speen';
    }

    // -- components -------------------------------------------------------------------------------
    this.children = [ lambdaSpeen, mesh ];
  }
}
