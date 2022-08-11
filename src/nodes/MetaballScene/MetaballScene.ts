import { CameraStack } from '../CameraStack/CameraStack';
import { Metaball } from './Metaball/Metaball';
import { MetaballParticles } from './MetaballParticles/MetaballParticles';
import { PointLightNode } from '../Lights/PointLightNode';
import { SceneNode } from '../../heck/components/SceneNode';
import { cameraStackATarget } from '../../globals/cameraStackTargets';
import { mainCameraStackResources } from '../CameraStack/mainCameraStackResources';
import { swapShadowMap1, swapShadowMap2, swapShadowMap3 } from '../../globals/swapShadowMap';

export class MetaballScene extends SceneNode {
  public constructor() {
    super();

    const scene = this;

    const light1 = new PointLightNode( {
      scene,
      swapShadowMap: swapShadowMap1,
      shadowMapFov: 40.0,
    } );
    light1.transform.lookAt( [ 0.0, 4.0, -5.0 ] );
    light1.color = [ 3000.0, 3000.0, 3000.0 ];

    const light2 = new PointLightNode( {
      scene,
      swapShadowMap: swapShadowMap2,
      shadowMapFov: 40.0,
    } );
    light2.transform.lookAt( [ 3.0, -2.0, -1.0 ] );
    light2.color = [ 6.0, 6.0, 6.0 ];

    const light3 = new PointLightNode( {
      scene,
      swapShadowMap: swapShadowMap3,
      shadowMapFov: 40.0,
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

    const camera = new CameraStack( {
      scene,
      resources: mainCameraStackResources,
      target: cameraStackATarget,
      dofParams: [ 2.5, 12.0 ],
    } );
    camera.transform.lookAt(
      [ 0.0, 0.0, 3.2 ],
      [ -0.6, 0.0, 0.0 ],
      -0.2,
    );

    this.children = [
      light1,
      light2,
      light3,
      metaball,
      particles,
      camera,
    ];
  }
}
