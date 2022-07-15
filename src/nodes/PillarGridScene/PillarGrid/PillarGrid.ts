import { genCube } from '../../../geometries/genCube';
import { glCreateVertexbuffer } from '../../../gl/glCreateVertexbuffer';
import { glVertexArrayBindVertexbuffer } from '../../../gl/glVertexArrayBindVertexbuffer';
import { dummyRenderTarget1, dummyRenderTarget4 } from '../../../globals/dummyRenderTarget';
import { emit, EventType } from '../../../globals/globalEvent';
import { Lambda } from '../../../heck/components/Lambda';
import { Mesh } from '../../../heck/components/Mesh';
import { SceneNode } from '../../../heck/components/SceneNode';
import { Material } from '../../../heck/Material';
import { CameraStack } from '../../CameraStack/CameraStack';
import { pillarGridBodyFrag } from './shaders/pillarGridBodyFrag';
import { pillarGridVert } from './shaders/pillarGridVert';

export class PillarGrid extends SceneNode {
  public cameraProxy: SceneNode;

  public constructor() {
    super();

    // -- geometry ---------------------------------------------------------------------------------
    const { geometry } = genCube( {
      dimension: [ 0.1, 0.1, 1.0 ],
    } );
    geometry.primcount = 1024;

    const arrayInstance = new Float32Array( 2048 );
    for ( let i = 0; i < 1024; i ++ ) {
      arrayInstance[ i * 2     ] = ( ( i % 32 ) - 15.5 ) * 0.21;
      arrayInstance[ i * 2 + 1 ] = ( ( ~~( i / 32 ) ) - 15.5 ) * 0.21;
    }

    const bufferInstance = glCreateVertexbuffer( arrayInstance );

    glVertexArrayBindVertexbuffer( geometry.vao, bufferInstance, 3, 2, 1 );

    // -- material body ----------------------------------------------------------------------------
    const deferred = new Material(
      pillarGridVert,
      pillarGridBodyFrag( 'deferred' ),
      {
        initOptions: { geometry, target: dummyRenderTarget4 },
      },
    );

    const depth = new Material(
      pillarGridVert,
      pillarGridBodyFrag( 'depth' ),
      {
        initOptions: { geometry, target: dummyRenderTarget1 },
      },
    )

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        [
          './shaders/pillarGridVert',
          './shaders/pillarGridBodyFrag',
        ],
        ( [ v, f ] ) => {
          deferred.replaceShader( v?.pillarGridVert, f?.pillarGridBodyFrag( 'deferred' ) );
          depth.replaceShader( v?.pillarGridVert, f?.pillarGridBodyFrag( 'depth' ) );
        },
      )
    }

    // -- mesh body --------------------------------------------------------------------------------
    const meshBody = new Mesh( {
      geometry,
      materials: { deferred, depth },
    } );

    if ( import.meta.env.DEV ) {
      meshBody.name = 'meshBody';
    }

    // -- camera proxy -----------------------------------------------------------------------------
    this.cameraProxy = new SceneNode();
    this.cameraProxy.transform.lookAt(
      [ 0.0, -0.8, 0.8 ],
      [ 0.0, 0.0, 0.0 ],
      [ 0.0, 1.0, 0.0 ],
      0.0,
    );

    const lambdaUpdateCameraParams = new Lambda( {
      onUpdate: () => {
        emit( EventType.Camera );

        ( this.cameraProxy.children[ 0 ] as CameraStack | undefined )?.setScene( this );
      },
    } );

    if ( import.meta.env.DEV ) {
      lambdaUpdateCameraParams.name = 'lambdaUpdateCameraParams';
    }

    // -- children ---------------------------------------------------------------------------------
    this.children = [
      meshBody,
      lambdaUpdateCameraParams,
      this.cameraProxy,
    ];
  }
}
