import { CameraStack } from '../CameraStack/CameraStack';
import { CubemapNode } from '../CubemapNode/CubemapNode';
import { FAR } from '../../config';
import { Lambda } from '../../heck/components/Lambda';
import { PillarGrid } from './PillarGrid/PillarGrid';
import { PlaneBackground } from '../utils/PlaneBackground';
import { PointLightNode } from '../Lights/PointLightNode';
import { SceneNode } from '../../heck/components/SceneNode';
import { abs, add, def, defUniformNamed, floor, mad, mul, mulAssign, step, sub, subAssign, sw, vec3, vec4 } from '../../shaders/shaderBuilder';
import { cameraStackATarget } from '../../globals/cameraStackTargets';
import { isectPlane } from '../../shaders/modules/isectPlane';
import { mainCameraStackResources } from '../CameraStack/mainCameraStackResources';
import { pcg3df } from '../../shaders/modules/pcg3df';
import { quatRotationZ } from '@0b5vr/experimental';
import { swapShadowMap1, swapShadowMap2 } from '../../globals/swapShadowMap';

export class PillarGridScene extends SceneNode {
  public constructor() {
    super();

    const scene = this;
    const cubemapExclusionTag = Symbol();

    // -- light ------------------------------------------------------------------------------------
    const lightT = new PointLightNode( {
      scene,
      swapShadowMap: swapShadowMap1,
      shadowMapFov: 40.0,
    } );
    lightT.transform.lookAt( [ 5.0, -3.0, 2.0 ], [ 0.0, 0.0, 1.0 ] );
    lightT.color = [ 500.0, 500.0, 500.0 ];

    const lightB = new PointLightNode( {
      scene,
      swapShadowMap: swapShadowMap2,
      shadowMapFov: 40.0,
    } );
    lightB.transform.lookAt( [ 0.0, 3.5, 4.0 ], [ 0.0, 0.0, 1.0 ] );
    lightB.color = [ 100.0, 100.0, 100.0 ];

    if ( import.meta.env.DEV ) {
      lightT.name = 'lightT';
      lightB.name = 'lightB';
    }

    // -- pillar grid ------------------------------------------------------------------------------
    const pillarGrid = new PillarGrid();
    pillarGrid.tags = [ cubemapExclusionTag ];

    const lambdaSpeen = new Lambda( {
      onUpdate( { time } ) {
        pillarGrid.transform.rotation = quatRotationZ( 0.1 * time );
      },
    } );

    if ( import.meta.env.DEV ) {
      lambdaSpeen.name = 'lambdaSpeen';
    }

    // -- background -------------------------------------------------------------------------------
    const background = new PlaneBackground( () => {
      const time = defUniformNamed( 'float', 'time' );

      return ( ro, rd ) => {
        const isect = isectPlane(
          sub( ro, vec3( 0.0, 0.0, 10.0 ) ),
          rd,
          vec3( 0.0, 0.0, -1.0 ),
        );
        const rp = mad( isect, rd, ro );

        const coord = def( 'vec2', mul( 0.1, sw( rp, 'xy' ) ) );
        mulAssign( sw( coord, 'y' ), 4.0 );
        const row = floor( add( sw( coord, 'y' ), 0.5 ) );
        const dicerow = def( 'float', sw( pcg3df( vec3( row ) ), 'x' ) );
        subAssign( sw( coord, 'y' ), row );
        subAssign( sw( coord, 'x' ), mul( 10.0, sub( dicerow, 0.5 ), time ) );

        const shape = mul(
          step( 0.5, sw( pcg3df( vec3( row, floor( sw( coord, 'x' ) ), 0.0 ) ), 'x' ) ), // dice
          step( abs( sw( coord, 'y' ) ), 0.3 ), // stripe
          step( abs( sw( rp, 'x' ) ), 40.0 ), // far fog
          step( abs( sw( rp, 'y' ) ), 40.0 ), // far fog
          step( isect, FAR - 1E-3 ), // plane hit
        );

        return vec4(
          vec3( shape ),
          1.0,
        );
      };
    } );

    // -- cubemap ----------------------------------------------------------------------------------
    const cubemapNode = new CubemapNode( {
      scene,
      accumMix: 0.3,
      exclusionTags: [ cubemapExclusionTag ],
    } );

    // -- camera -----------------------------------------------------------------------------------
    const camera = new CameraStack( {
      scene,
      cubemapNode,
      resources: mainCameraStackResources,
      target: cameraStackATarget,
      fog: [ 0.0, 3.0, 5.0 ],
      useAO: true,
      dofParams: [ 2.8, 24.0 ],
    } );
    camera.transform.lookAt(
      [ 0.0, -2.0, 3.0 ],
      [ 0.0, 1.0, 0.0 ],
      -0.2,
    );

    // -- children ---------------------------------------------------------------------------------
    this.children = [
      lightT,
      lightB,
      lambdaSpeen,
      pillarGrid,
      background,
      cubemapNode,
      camera,
    ];
  }
}
