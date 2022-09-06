import { CameraStack } from '../CameraStack/CameraStack';
import { HALF_SQRT3 } from '../../utils/constants';
import { Material } from '../../heck/Material';
import { Mesh } from '../../heck/components/Mesh';
import { PointLightNode } from '../Lights/PointLightNode';
import { SceneNode } from '../../heck/components/SceneNode';
import { cameraStackATarget } from '../../globals/cameraStackTargets';
import { createRaymarchCameraUniformsLambda } from '../utils/createRaymarchCameraUniformsLambda';
import { dummyRenderTarget4 } from '../../globals/dummyRenderTarget';
import { genOctahedron } from '../../geometries/genOctahedron';
import { glCreateVertexbuffer } from '../../gl/glCreateVertexbuffer';
import { glVertexArrayBindVertexbuffer } from '../../gl/glVertexArrayBindVertexbuffer';
import { mainCameraStackResources } from '../CameraStack/mainCameraStackResources';
import { sphereArrayFrag } from './shaders/sphereArrayFrag';
import { sphereArrayVert } from './shaders/sphereArrayVert';
import { swapShadowMap1, swapShadowMap2 } from '../../globals/swapShadowMap';

export class SphereArrayScene extends SceneNode {
  public constructor() {
    super();

    const scene = this;

    // == lights ===================================================================================
    const lightT = new PointLightNode( {
      scene,
      swapShadowMap: swapShadowMap1,
      shadowMapFov: 40.0,
    } );
    lightT.transform.lookAt( [ 0.0, 3.0, 3.0 ], [ 0.0, 0.0, 1.0 ] );
    lightT.color = [ 500.0, 500.0, 500.0 ];

    const lightB = new PointLightNode( {
      scene,
      swapShadowMap: swapShadowMap2,
      shadowMapFov: 20.0,
    } );
    lightB.transform.lookAt( [ 0.0, -10.0, -20.0 ], [ 0.0, 0.0, 0.0 ] );
    lightB.color = [ 100000.0, 100000.0, 100000.0 ];

    if ( import.meta.env.DEV ) {
      lightT.name = 'lightT';
      lightB.name = 'lightB';
    }

    // == sphere array =============================================================================

    // -- geometry ---------------------------------------------------------------------------------
    const geometry = genOctahedron( 2 );
    geometry.primcount = 1024;

    const arrayInstance = new Float32Array( 2048 );
    for ( let i = 0; i < 1024; i ++ ) {
      arrayInstance[ i * 2     ] = ( ( i % 32 ) - 16 ) * 0.2 + ( ~~( i / 32 ) % 2 ) * 0.1;
      arrayInstance[ i * 2 + 1 ] = ( ( ~~( i / 32 ) ) - 15.5 ) * 0.2 * HALF_SQRT3;
    }

    const bufferInstance = glCreateVertexbuffer( arrayInstance );

    glVertexArrayBindVertexbuffer( geometry.vao, bufferInstance, 3, 2, 1 );

    // -- material ---------------------------------------------------------------------------------
    const deferred = new Material(
      sphereArrayVert,
      sphereArrayFrag( 'deferred' ),
      {
        initOptions: { geometry, target: dummyRenderTarget4 },
      },
    );

    const depth = new Material(
      sphereArrayVert,
      sphereArrayFrag( 'depth' ),
      {
        initOptions: { geometry, target: dummyRenderTarget4 },
      },
    );

    const lambdaRaymarchCameraUniforms = createRaymarchCameraUniformsLambda( [
      deferred,
      depth,
    ] );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        [
          './shaders/sphereArrayVert',
          './shaders/sphereArrayFrag',
        ],
        ( [ v, f ] ) => {
          deferred.replaceShader( v?.sphereArrayVert, f?.sphereArrayFrag( 'deferred' ) );
          depth.replaceShader( v?.sphereArrayVert, f?.sphereArrayFrag( 'depth' ) );
        },
      );
    }

    // -- mesh -------------------------------------------------------------------------------------
    const mesh = new Mesh( {
      geometry,
      materials: { deferred, depth },
    } );

    // == camera ===================================================================================
    const camera = new CameraStack( {
      scene,
      resources: mainCameraStackResources,
      target: cameraStackATarget,
      useAO: true,
      clear: [ 0.8, 0.8, 0.8, 1.0 ],
    } );
    camera.transform.lookAt(
      [ 0.0, 0.0, 2.0 ],
      [ 0.0, 0.0, 0.0 ],
      -0.0,
    );

    // == children =================================================================================
    this.children = [
      lightT,
      lightB,
      lambdaRaymarchCameraUniforms,
      mesh,
      camera,
    ];
  }
}
