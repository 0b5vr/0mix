import { CameraStack } from '../CameraStack/CameraStack';
import { GL_FRONT } from '../../gl/constants';
import { Lambda } from '../../heck/components/Lambda';
import { RaymarcherNode } from '../utils/RaymarcherNode';
import { SceneNode } from '../../heck/components/SceneNode';
import { auto } from '../../globals/automaton';
import { cameraStackATarget } from '../../globals/cameraStackTargets';
import { genCube } from '../../geometries/genCube';
import { mainCameraStackResources } from '../CameraStack/mainCameraStackResources';
import { objectVert } from '../../shaders/common/objectVert';
import { octreeTunnelFrag } from './shaders/octreeTunnelFrag';
import { quatRotationZ } from '@0b5vr/experimental';

export class OctreeTunnelScene extends SceneNode {
  public constructor() {
    super();

    const scene = this;

    // -- node -------------------------------------------------------------------------------------
    const geometry = genCube( { dimension: [ 0.5, 0.5, 100.0 ] } );

    const tunnel = new RaymarcherNode( octreeTunnelFrag, { geometry } );
    tunnel.mesh.cull = GL_FRONT;

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        './shaders/octreeTunnelFrag',
        ( { octreeTunnelFrag } ) => {
          const { deferred, depth } = tunnel.materials;

          deferred.replaceShader( objectVert, octreeTunnelFrag( 'deferred' ) );
          depth.replaceShader( objectVert, octreeTunnelFrag( 'depth' ) );
        },
      );
    }

    // -- camera -----------------------------------------------------------------------------------
    const camera = new CameraStack( {
      scene,
      resources: mainCameraStackResources,
      target: cameraStackATarget,
      fog: [ 0.0, 5.0, 10.0 ],
      dofParams: [ 4.0, 4.0 ],
      useAO: false,
      denoiserParams: [ 0.4, 0.1, 0.5 ],
    } );

    const lambdaUpdateCamera = new Lambda( {
      onUpdate( { time } ) {
        camera.transform.rotation = quatRotationZ( 0.1 * time );
      },
    } );

    // -- auto -------------------------------------------------------------------------------------
    auto( 'OctreeTunnel/diceSize', ( { value } ) => {
      const { deferred, depth } = tunnel.materials;

      deferred.addUniform( 'diceSize', '1f', value );
      depth.addUniform( 'diceSize', '1f', value );
    } );

    auto( 'OctreeTunnel/density', ( { value } ) => {
      const { deferred, depth } = tunnel.materials;

      deferred.addUniform( 'density', '1f', value );
      depth.addUniform( 'density', '1f', value );
    } );

    // -- children ---------------------------------------------------------------------------------
    this.children = [
      tunnel,
      lambdaUpdateCamera,
      camera,
    ];
  }
}
