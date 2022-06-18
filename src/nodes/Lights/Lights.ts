import { FAR, NEAR } from '../../config';
import { LightShaft } from './LightShaft';
import { PointLightNode } from './PointLightNode';
import { SceneNode } from '../../heck/components/SceneNode';
import { auto } from '../../globals/automaton';
import { vecScale } from '@0b5vr/experimental';

export class Lights extends SceneNode {
  public constructor( scene: SceneNode ) {
    super();

    const lightRight = new PointLightNode( {
      scene,
      shadowMapFov: 60.0,
      shadowMapNear: NEAR,
      shadowMapFar: FAR,
    } );
    lightRight.spotness = 0.9;
    lightRight.transform.lookAt( [ 2.8, 0.2, 2.5 ], [ 0.0, 3.0, 0.0 ] );

    if ( import.meta.env.DEV ) {
      lightRight.name = 'lightRight';
    }

    const shaftRight = new LightShaft( {
      light: lightRight,
      intensity: 0.01,
    } );
    // lightRight.children.push( shaftRight );

    auto( 'lightRight/intensity', ( { value } ) => {
      lightRight.color = vecScale( [ 100.0, 100.0, 100.0 ], value ) as [ number, number, number ];
    } );

    const lightLeft = new PointLightNode( {
      scene,
      shadowMapFov: 60.0,
      shadowMapNear: NEAR,
      shadowMapFar: FAR,
    } );
    lightLeft.spotness = 0.9;
    lightLeft.transform.lookAt( [ -5.0, 0.2, 0.0 ], [ 0.0, 3.0, 0.0 ] );

    if ( import.meta.env.DEV ) {
      lightLeft.name = 'lightLeft';
    }

    const shaftLeft = new LightShaft( {
      light: lightLeft,
      intensity: 0.01,
    } );
    // lightLeft.children.push( shaftLeft );

    auto( 'lightLeft/intensity', ( { value } ) => {
      lightLeft.color = vecScale( [ 100.0, 100.0, 100.0 ], value ) as [ number, number, number ];
    } );

    const lightTop = new PointLightNode( {
      scene,
      shadowMapFov: 60.0,
      shadowMapNear: NEAR,
      shadowMapFar: FAR,
    } );
    lightTop.spotness = 0.9;
    lightTop.transform.lookAt( [ 0.01, 9.0, 0.01 ], [ 0.0, 3.0, 0.0 ] );

    if ( import.meta.env.DEV ) {
      lightTop.name = 'lightTop';
    }

    const shaftTop = new LightShaft( {
      light: lightTop,
      intensity: 0.01,
    } );
    // lightTop.children.push( shaftTop );

    auto( 'lightTop/intensity', ( { value } ) => {
      lightTop.color = vecScale( [ 100.0, 150.0, 190.0 ], value ) as [ number, number, number ];
    } );

    this.children = [ lightLeft, lightRight, lightTop ];
  }
}
