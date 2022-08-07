import { CameraStack } from '../CameraStack/CameraStack';
import { GL_LINE_STRIP } from '../../gl/constants';
import { Geometry } from '../../heck/Geometry';
import { MTL_UNLIT } from '../CameraStack/deferredConstants';
import { Material } from '../../heck/Material';
import { Mesh } from '../../heck/components/Mesh';
import { SceneNode } from '../../heck/components/SceneNode';
import { cameraStackBTarget } from '../../globals/cameraStackTargets';
import { deferredColorFrag } from '../../shaders/common/deferredColorFrag';
import { dummyRenderTarget4 } from '../../globals/dummyRenderTarget';
import { glCreateVertexbuffer } from '../../gl/glCreateVertexbuffer';
import { glVertexArrayBindVertexbuffer } from '../../gl/glVertexArrayBindVertexbuffer';
import { lineWaveVert } from './shaders/lineWaveVert';
import { mainCameraStackResources } from '../CameraStack/mainCameraStackResources';

export class LineWaveScene extends SceneNode {
  public constructor() {
    super();

    // -- geometry ---------------------------------------------------------------------------------
    const geometry = new Geometry();
    geometry.primcount = 512;
    geometry.count = 512;
    geometry.mode = GL_LINE_STRIP;

    const bufferInstanceArray = new Float32Array( 513 ).map( ( _, i ) => i / 512 * 4.0 - 2.0 );
    const bufferInstance = glCreateVertexbuffer( bufferInstanceArray );

    glVertexArrayBindVertexbuffer( geometry.vao, bufferInstance, 0, 1 );
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
      );
    }

    // -- mesh -------------------------------------------------------------------------------------
    const mesh = new Mesh( {
      geometry,
      materials: { deferred },
    } );

    if ( import.meta.env.DEV ) {
      mesh.name = 'mesh';
    }

    // -- camera proxy -----------------------------------------------------------------------------
    const camera = new CameraStack( {
      scene: this,
      resources: mainCameraStackResources,
      target: cameraStackBTarget,
    } );
    camera.transform.lookAt(
      [ 0.0, -0.8, 0.8 ],
      [ 0.0, 0.0, 0.0 ],
      [ 0.0, 1.0, 0.0 ],
      0.0,
    );

    // -- children ---------------------------------------------------------------------------------
    this.children = [
      mesh,
      camera,
    ];
  }
}
