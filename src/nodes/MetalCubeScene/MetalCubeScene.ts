import { CameraStack } from '../CameraStack/CameraStack';
import { RaymarcherNode } from '../utils/RaymarcherNode';
import { SceneNode } from '../../heck/components/SceneNode';
import { cameraStackATarget } from '../../globals/cameraStackTargets';
import { genOctahedron } from '../../geometries/genOctahedron';
import { mainCameraStackResources } from '../CameraStack/mainCameraStackResources';
import { metalCubeFrag } from './shaders/metalCubeFrag';
import { objectVert } from '../../shaders/common/objectVert';

export class MetalCubeScene extends SceneNode {
  public constructor() {
    super();

    const scene = this;
    const cubemapExclusionTag = Symbol();

    // -- metalCube ---------------------------------------------------------------------------------
    const geometry = genOctahedron( 2 );

    const metalCube = new RaymarcherNode( metalCubeFrag, {
      geometry,
      tags: [ cubemapExclusionTag ],
    } );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        './shaders/metalCubeFrag',
        ( { metalCubeFrag } ) => {
          const { deferred, depth } = metalCube.materials;

          deferred.replaceShader( objectVert, metalCubeFrag( 'deferred' ) );
          depth.replaceShader( objectVert, metalCubeFrag( 'depth' ) );
        },
      );
    }

    // -- camera -----------------------------------------------------------------------------------
    const camera = new CameraStack( {
      scene,
      resources: mainCameraStackResources,
      target: cameraStackATarget,
      dofParams: [ 1.8, 32.0 ],
    } );
    camera.transform.lookAt(
      [ -0.3, 0.0, 2.2 ],
      [ -0.3, 0.0, 0.0 ],
    );

    // -- children ---------------------------------------------------------------------------------
    this.children = [
      metalCube,
      camera,
    ];
  }
}
