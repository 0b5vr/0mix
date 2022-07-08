import { GL_LINE_STRIP } from '../../gl/constants';
import { glCreateVertexbuffer } from '../../gl/glCreateVertexbuffer';
import { glVertexArrayBindVertexbuffer } from '../../gl/glVertexArrayBindVertexbuffer';
import { dummyRenderTarget4 } from '../../globals/dummyRenderTarget';
import { emit, EventType } from '../../globals/globalEvent';
import { Lambda } from '../../heck/components/Lambda';
import { Mesh } from '../../heck/components/Mesh';
import { SceneNode } from '../../heck/components/SceneNode';
import { Geometry } from '../../heck/Geometry';
import { Material } from '../../heck/Material';
import { deferredColorFrag } from '../../shaders/common/deferredColorFrag';
import { CameraStack } from '../CameraStack/CameraStack';
import { MTL_UNLIT } from '../CameraStack/deferredConstants';
import { lineWaveVert } from './shaders/lineWaveVert';

export class LineWave extends SceneNode {
  public cameraProxy: SceneNode;

  public constructor() {
    super();

    // -- geometry ---------------------------------------------------------------------------------
    const geometry = new Geometry();
    geometry.primcount = 512;
    geometry.count = 512;
    geometry.mode = GL_LINE_STRIP;

    const bufferInstanceArray = new Float32Array( 513 ).map( ( _, i ) => i / 512 * 4.0 - 2.0 );
    const bufferInstanceA = glCreateVertexbuffer( bufferInstanceArray ); // TODO
    const bufferInstance = glCreateVertexbuffer( bufferInstanceArray );

    glVertexArrayBindVertexbuffer( geometry.vao, bufferInstanceA, 0, 1 );
    glVertexArrayBindVertexbuffer( geometry.vao, bufferInstance, 1, 1, 1 );

    // -- material ---------------------------------------------------------------------------------
    const deferred = new Material(
      lineWaveVert,
      deferredColorFrag,
      {
        initOptions: { geometry, target: dummyRenderTarget4 },
      },
    );
    deferred.addUniform( 'color', '4f', 0.4, 0.4, 0.4, 1.0 );
    deferred.addUniform( 'mtlKind', '1f', MTL_UNLIT );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        './shaders/lineWaveVert',
        ( { lineWaveVert } ) => {
          deferred.replaceShader( lineWaveVert, deferredColorFrag );
        }
      )
    }

    // -- mesh -------------------------------------------------------------------------------------
    const mesh = new Mesh( {
      geometry,
      materials: { deferred },
      depthTest: false, // I'm not sure why this is required
      depthWrite: false, // I'm not sure why this is required
    } );

    if ( import.meta.env.DEV ) {
      mesh.name = 'mesh';
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
        emit( EventType.CameraFov, 40.0 );
        emit( EventType.CameraDoF, [ 0.0, 0.0 ] );
        ( this.cameraProxy.children[ 0 ] as CameraStack | undefined )?.setScene( this );
      },
    } );

    if ( import.meta.env.DEV ) {
      lambdaUpdateCameraParams.name = 'lambdaUpdateCameraParams';
    }

    // -- children ---------------------------------------------------------------------------------
    this.children = [
      mesh,
      lambdaUpdateCameraParams,
      this.cameraProxy,
    ];
  }
}
