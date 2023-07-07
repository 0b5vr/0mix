import { CameraStack } from '../CameraStack/CameraStack';
import { CanvasTexture } from '../utils/CanvasTexture';
import { GL_TEXTURE_2D } from '../../gl/constants';
import { Lambda } from '../../heck/components/Lambda';
import { RaymarcherNode } from '../utils/RaymarcherNode';
import { SceneNode } from '../../heck/components/SceneNode';
import { cameraStackATarget } from '../../globals/cameraStackTargets';
import { createPromiseSVGImage } from '../../utils/createPromiseSVGImage';
import { mainCameraStackResources } from '../CameraStack/mainCameraStackResources';
import { objectVert } from '../../shaders/common/objectVert';
import { quad3DGeometry } from '../../globals/quad3DGeometry';
import { section2Frag } from './shaders/section2Frag';
import section2Svg from './assets/section2.svg?raw';

export class Section2Scene extends SceneNode {
  public constructor() {
    super();

    const scene = this;

    // -- canvas -----------------------------------------------------------------------------------
    const texture = new CanvasTexture( 1024, 512 );
    const { context } = texture;

    createPromiseSVGImage( section2Svg ).then( ( image ) => {
      context.drawImage( image, 0, 0 );
      texture.updateTexture();
    } );

    // -- metalCube --------------------------------------------------------------------------------
    const section2 = new RaymarcherNode( section2Frag, {
      geometry: quad3DGeometry,
    } );

    section2.materials.deferred.addUniformTextures( 'sampler0', GL_TEXTURE_2D, texture.texture );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        './shaders/section2Frag',
        ( { section2Frag } ) => {
          const { deferred, depth } = section2.materials;

          deferred.replaceShader( objectVert, section2Frag( 'deferred' ) );
          depth.replaceShader( objectVert, section2Frag( 'depth' ) );
        },
      );
    }

    // -- camera -----------------------------------------------------------------------------------
    const camera = new CameraStack( {
      scene,
      resources: mainCameraStackResources,
      target: cameraStackATarget,
      fog: [ 0.0, 2.0, 10.0 ],
      dofParams: [ 1.2, 16.0 ],
    } );

    const lambdaShake = new Lambda( {
      onUpdate( { time } ) {
        camera.transform.lookAt(
          [
            0.3 + 0.02 * Math.sin( 2.0 * time ),
            -0.4 + 0.01 * Math.cos( 3.7 * time ),
            0.3,
          ],
          [ 0.0, 0.05, -1.0 ],
          0.01 * Math.sin( 1.4 * time ),
        );
      },
    } );

    // -- children ---------------------------------------------------------------------------------
    this.children = [
      section2,
      lambdaShake,
      camera,
    ];
  }
}
