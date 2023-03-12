import { CameraStack } from '../CameraStack/CameraStack';
import { PointLightNode } from '../Lights/PointLightNode';
import { RaymarcherNode } from '../utils/RaymarcherNode';
import { SceneNode } from '../../heck/components/SceneNode';
import { arraySerial } from '@0b5vr/experimental';
import { cameraStackATarget } from '../../globals/cameraStackTargets';
import { genCube } from '../../geometries/genCube';
import { glCreateVertexbuffer } from '../../gl/glCreateVertexbuffer';
import { glVertexArrayBindVertexbuffer } from '../../gl/glVertexArrayBindVertexbuffer';
import { mainCameraStackResources } from '../CameraStack/mainCameraStackResources';
import { riePillarFrag } from './shaders/riePillarFrag';
import { riePillarVert } from './shaders/riePillarVert';
import { swapShadowMap1, swapShadowMap2 } from '../../globals/swapShadowMap';

export class RieScene extends SceneNode {
  public constructor() {
    super();

    const scene = this;

    // -- lights -----------------------------------------------------------------------------------
    const light1 = new PointLightNode( {
      scene,
      swapShadowMap: swapShadowMap1,
      shadowMapFov: 40.0,
    } );
    light1.transform.lookAt( [ 0.2, 0.2, 8.0 ] );
    light1.color = [ 50.0, 50.0, 50.0 ];

    const light2 = new PointLightNode( {
      scene,
      swapShadowMap: swapShadowMap2,
      shadowMapFov: 40.0,
    } );
    light2.transform.lookAt( [ 0.0, 0.0, 5.5 ] );
    light2.color = [ 5.0, 5.0, 5.0 ];

    // -- pillars ----------------------------------------------------------------------------------
    const geometry = genCube( { dimension: [ 10.0, 0.1, 0.1 ] } );

    const bufferInstance = glCreateVertexbuffer( new Float32Array( arraySerial( 100 ) ) );
    glVertexArrayBindVertexbuffer( geometry.vao, bufferInstance, 2, 1, 1 );

    geometry.primcount = 100;

    const pillars = new RaymarcherNode(
      riePillarFrag,
      {
        geometry,
        vert: riePillarVert,
      }
    );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        [ './shaders/riePillarVert', './shaders/riePillarFrag' ],
        ( [ v, f ] ) => {
          pillars.materials.deferred.replaceShader( v?.riePillarVert, f?.riePillarFrag( 'deferred' ) );
          pillars.materials.depth.replaceShader( v?.riePillarVert, f?.riePillarFrag( 'depth' ) );
        },
      );
    }

    // -- camera -----------------------------------------------------------------------------------
    const camera = new CameraStack( {
      scene,
      resources: mainCameraStackResources,
      target: cameraStackATarget,
      useAO: true,
      dofParams: [ 3.0, 8.0 ],
      fog: [ 0.0, 10.0, 15.0 ],
    } );
    camera.transform.lookAt(
      [ 0.0, 0.0, 5.0 ],
    );

    // -- children ---------------------------------------------------------------------------------
    this.children = [
      light1,
      light2,
      pillars,
      camera,
    ];
  }
}
