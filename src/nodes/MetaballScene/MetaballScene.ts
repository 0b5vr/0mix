import { CameraStack } from '../CameraStack/CameraStack';
import { EventType, emit } from '../../globals/globalEvent';
import { FAR, NEAR } from '../../config';
import { Lambda } from '../../heck/components/Lambda';
import { Metaball } from './Metaball/Metaball';
import { MetaballParticles } from './MetaballParticles/MetaballParticles';
import { PointLightNode } from '../Lights/PointLightNode';
import { SceneNode } from '../../heck/components/SceneNode';

export class MetaballScene extends SceneNode {
  public cameraProxy: SceneNode;

  public constructor() {
    super();

    const scene = this;

    const light1 = new PointLightNode( {
      scene,
      shadowMapFov: 40.0,
      shadowMapNear: NEAR,
      shadowMapFar: FAR,
    } );
    light1.transform.lookAt( [ 0.0, 4.0, -5.0 ] );
    light1.color = [ 3000.0, 3000.0, 3000.0 ];

    const light2 = new PointLightNode( {
      scene,
      shadowMapFov: 40.0,
      shadowMapNear: NEAR,
      shadowMapFar: FAR,
    } );
    light2.transform.lookAt( [ 3.0, -2.0, -1.0 ] );
    light2.color = [ 6.0, 6.0, 6.0 ];

    const light3 = new PointLightNode( {
      scene,
      shadowMapFov: 40.0,
      shadowMapNear: NEAR,
      shadowMapFar: FAR,
    } );
    light3.transform.lookAt( [ -3.0, 0.0, 3.0 ] );
    light3.color = [ 4.0, 5.0, 6.0 ];

    if ( import.meta.env.DEV ) {
      light1.name = 'light1';
      light2.name = 'light2';
      light3.name = 'light3';
    }

    const cubemapExclusionTag = Symbol();

    const metaball = new Metaball();
    metaball.transform.scale = [ 3.0, 3.0, 3.0 ];
    metaball.tags.push( cubemapExclusionTag );

    const particles = new MetaballParticles();
    particles.transform.scale = [ 3.0, 3.0, 3.0 ];
    particles.tags.push( cubemapExclusionTag );

    this.cameraProxy = new SceneNode();
    this.cameraProxy.transform.lookAt(
      [ 0.0, 0.0, 3.2 ],
      [ -0.6, 0.0, 0.0 ],
      [ 0.0, 1.0, 0.0 ],
      -0.2,
    );

    const lambdaUpdateCameraParams = new Lambda( {
      onUpdate: () => {
        emit( EventType.Camera, {
          dof: [ 2.5, 4.0 ],
          fog: [ 0.0, 20.0, 20.0 ],
        } );
        emit( EventType.CubeMap );

        ( this.cameraProxy.children[ 0 ] as CameraStack | undefined )?.setScene( this );
      },
    } );

    if ( import.meta.env.DEV ) {
      lambdaUpdateCameraParams.name = 'lambdaUpdateCameraParams';
    }

    this.children = [
      light1,
      light2,
      light3,
      metaball,
      particles,
      lambdaUpdateCameraParams,
      this.cameraProxy,
    ];
  }
}
