import { GL_LINES } from '../../../gl/constants';
import { Geometry } from '../../../heck/Geometry';
import { MTL_UNLIT } from '../../CameraStack/deferredConstants';
import { Material } from '../../../heck/Material';
import { Mesh } from '../../../heck/components/Mesh';
import { SceneNode } from '../../../heck/components/SceneNode';
import { dummyRenderTarget1, dummyRenderTarget4 } from '../../../globals/dummyRenderTarget';
import { genCube } from '../../../geometries/genCube';
import { glCreateVertexbuffer } from '../../../gl/glCreateVertexbuffer';
import { glVertexArrayBindVertexbuffer } from '../../../gl/glVertexArrayBindVertexbuffer';
import { pillarGridBodyFrag } from './shaders/pillarGridBodyFrag';
import { pillarGridBodyVert } from './shaders/pillarGridBodyVert';
import { pillarGridFrameFrag } from './shaders/pillarGridFrameFrag';
import { pillarGridFrameVert } from './shaders/pillarGridFrameVert';

export class PillarGrid extends SceneNode {
  public constructor() {
    super();

    // -- geometry body ----------------------------------------------------------------------------
    const geometry = genCube( {
      dimension: [ 0.1, 0.1, 1.0 ],
    } );
    geometry.primcount = 1024;

    const arrayInstance = new Float32Array( 2048 );
    for ( let i = 0; i < 1024; i ++ ) {
      arrayInstance[ i * 2     ] = ( ( i % 32 ) - 15.5 ) * 0.2;
      arrayInstance[ i * 2 + 1 ] = ( ( ~~( i / 32 ) ) - 15.5 ) * 0.2;
    }

    const bufferInstance = glCreateVertexbuffer( arrayInstance );

    glVertexArrayBindVertexbuffer( geometry.vao, bufferInstance, 3, 2, 1 );

    // -- geometry frame ---------------------------------------------------------------------------
    const geometryFrame = new Geometry();
    geometryFrame.count = 16;
    geometryFrame.primcount = 1024;
    geometryFrame.mode = GL_LINES;

    const arrayFramePosition = new Float32Array( [
      -0.1, -0.1, 1.0,
      0.1, -0.1, 1.0,
      0.1, -0.1, 1.0,
      0.1, 0.1, 1.0,
      0.1, 0.1, 1.0,
      -0.1, 0.1, 1.0,
      -0.1, 0.1, 1.0,
      -0.1, -0.1, 1.0,

      -0.1, -0.1, 1.0,
      -0.1, -0.1, 0.0,
      0.1, -0.1, 1.0,
      0.1, -0.1, 0.0,
      0.1, 0.1, 1.0,
      0.1, 0.1, 0.0,
      -0.1, 0.1, 1.0,
      -0.1, 0.1, 0.0,
    ] );
    const bufferFramePosition = glCreateVertexbuffer( arrayFramePosition );

    glVertexArrayBindVertexbuffer( geometryFrame.vao, bufferFramePosition, 0, 3 );
    glVertexArrayBindVertexbuffer( geometryFrame.vao, bufferInstance, 1, 2, 1 );

    // -- material body ----------------------------------------------------------------------------
    const deferred = new Material(
      pillarGridBodyVert,
      pillarGridBodyFrag( 'deferred' ),
      {
        initOptions: { geometry, target: dummyRenderTarget4 },
      },
    );

    const depth = new Material(
      pillarGridBodyVert,
      pillarGridBodyFrag( 'depth' ),
      {
        initOptions: { geometry, target: dummyRenderTarget1 },
      },
    );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        [
          './shaders/pillarGridBodyVert',
          './shaders/pillarGridBodyFrag',
        ],
        ( [ v, f ] ) => {
          deferred.replaceShader( v?.pillarGridBodyVert, f?.pillarGridBodyFrag( 'deferred' ) );
          depth.replaceShader( v?.pillarGridBodyVert, f?.pillarGridBodyFrag( 'depth' ) );
        },
      );
    }

    // -- material frame ---------------------------------------------------------------------------
    const deferredFrame = new Material(
      pillarGridFrameVert,
      pillarGridFrameFrag,
      {
        initOptions: { geometry, target: dummyRenderTarget4 },
      },
    );

    deferredFrame.addUniform( 'color', '4f', 0.5, 0.5, 0.5, 1.0 );
    deferredFrame.addUniform( 'mtlKind', '1f', MTL_UNLIT );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        [
          './shaders/pillarGridFrameVert',
          './shaders/pillarGridFrameFrag',
        ],
        ( [ v, f ] ) => {
          deferredFrame.replaceShader( v?.pillarGridFrameVert, f?.pillarGridFrameFrag );
        },
      );
    }

    // -- mesh body --------------------------------------------------------------------------------
    const meshBody = new Mesh( {
      geometry,
      materials: { deferred, depth },
    } );

    if ( import.meta.env.DEV ) {
      meshBody.name = 'meshBody';
    }

    // -- mesh frame -------------------------------------------------------------------------------
    const meshFrame = new Mesh( {
      geometry: geometryFrame,
      materials: { deferred: deferredFrame },
    } );

    if ( import.meta.env.DEV ) {
      meshFrame.name = 'meshFrame';
    }

    // -- children ---------------------------------------------------------------------------------
    this.children = [
      meshBody,
      meshFrame,
    ];
  }
}
