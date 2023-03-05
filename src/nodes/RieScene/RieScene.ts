import { CameraStack } from '../CameraStack/CameraStack';
import { Material } from '../../heck/Material';
import { Mesh } from '../../heck/components/Mesh';
import { PointLightNode } from '../Lights/PointLightNode';
import { SceneNode } from '../../heck/components/SceneNode';
import { arraySerial } from '@0b5vr/experimental';
import { cameraStackATarget } from '../../globals/cameraStackTargets';
import { depthFrag } from '../../shaders/common/depthFrag';
import { dummyRenderTarget1, dummyRenderTarget4 } from '../../globals/dummyRenderTarget';
import { genCube } from '../../geometries/genCube';
import { glCreateVertexbuffer } from '../../gl/glCreateVertexbuffer';
import { glVertexArrayBindVertexbuffer } from '../../gl/glVertexArrayBindVertexbuffer';
import { mainCameraStackResources } from '../CameraStack/mainCameraStackResources';
import { riePillarFrag } from './shaders/riePillarFrag';
import { riePillarVert } from './shaders/riePillarVert';
import { swapShadowMap1 } from '../../globals/swapShadowMap';

export class RieScene extends SceneNode {
  public constructor() {
    super();

    const scene = this;

    // -- lights -----------------------------------------------------------------------------------
    const light1 = new PointLightNode( {
      scene,
      swapShadowMap: swapShadowMap1,
      shadowMapFov: 30.0,
    } );
    light1.transform.lookAt( [ 0.0, 0.0, 5.0 ] );
    light1.color = [ 100.0, 100.0, 100.0 ];

    // -- pillars ----------------------------------------------------------------------------------
    const geometry = genCube( { dimension: [ 50.0, 0.1, 0.1 ] } );

    const bufferInstance = glCreateVertexbuffer( new Float32Array( arraySerial( 200 ) ) );
    glVertexArrayBindVertexbuffer( geometry.vao, bufferInstance, 2, 1, 1 );

    geometry.primcount = 200;

    const deferred = new Material(
      riePillarVert,
      riePillarFrag,
      {
        initOptions: { geometry, target: dummyRenderTarget4 },
      },
    );

    const depth = new Material(
      riePillarVert,
      depthFrag,
      {
        initOptions: { geometry, target: dummyRenderTarget1 },
      },
    );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        [ './shaders/riePillarVert', './shaders/riePillarFrag' ],
        ( [ v, f ] ) => {
          deferred.replaceShader( v?.riePillarVert, f?.riePillarFrag );
          depth.replaceShader( v?.riePillarVert, undefined );
        },
      );
    }

    const pillars = new Mesh( {
      geometry,
      materials: { deferred, depth },
    } );

    // -- camera -----------------------------------------------------------------------------------
    const camera = new CameraStack( {
      scene,
      resources: mainCameraStackResources,
      target: cameraStackATarget,
      useAO: true,
      dofParams: [ 5.0, 24.0 ],
      fog: [ 0.0, 20.0, 40.0 ],
    } );
    camera.transform.lookAt(
      [ 0.0, 0.0, 5.0 ],
    );

    // -- children ---------------------------------------------------------------------------------
    this.children = [
      light1,
      pillars,
      camera,
    ];
  }
}
