import { CameraStack } from '../CameraStack/CameraStack';
import { Fluid } from './Fluid';
import { GL_TEXTURE_2D } from '../../gl/constants';
import { InstancedLines } from '../utils/InstancedLines';
import { Lambda } from '../../heck/components/Lambda';
import { PlaneBackground } from '../utils/PlaneBackground';
import { PointLightNode } from '../Lights/PointLightNode';
import { RaymarcherNode } from '../utils/RaymarcherNode';
import { SceneNode } from '../../heck/components/SceneNode';
import { buildPlaneBackgroundFrag } from '../utils/shaders/buildPlaneBackgroundFrag';
import { cameraStackATarget } from '../../globals/cameraStackTargets';
import { createLightUniformsLambda } from '../utils/createLightUniformsLambda';
import { defDrawFluidBackground } from './shaders/defDrawFluidBackground';
import { fluidRingsVert } from './shaders/fluidRingsVert';
import { genOctahedron } from '../../geometries/genOctahedron';
import { mainCameraStackResources } from '../CameraStack/mainCameraStackResources';
import { objectVert } from '../../shaders/common/objectVert';
import { quatMultiply, quatRotationX, quatRotationY } from '@0b5vr/experimental';
import { stoneFrag } from './shaders/stoneFrag';
import { swapShadowMap1 } from '../../globals/swapShadowMap';

export class FluidScene extends SceneNode {
  public constructor() {
    super();

    const scene = this;

    // == lights ===================================================================================
    const lightF = new PointLightNode( {
      scene,
      swapShadowMap: swapShadowMap1,
      shadowMapFov: 40.0,
    } );
    lightF.transform.lookAt( [ 0.0, -2.0, 3.0 ], [ 0.0, 0.0, 0.0 ] );
    lightF.color = [ 20.0, 20.0, 20.0 ];

    const lightR = new PointLightNode( {
      scene,
      swapShadowMap: swapShadowMap1,
      shadowMapFov: 40.0,
    } );
    lightR.transform.lookAt( [ 0.0, 3.0, -2.0 ], [ 0.0, 0.0, 0.0 ] );
    lightR.color = [ 100.0, 100.0, 100.0 ];

    if ( import.meta.env.DEV ) {
      lightF.name = 'lightF';
      lightR.name = 'lightR';
    }

    // == background ===============================================================================
    const background = new PlaneBackground( defDrawFluidBackground );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        './shaders/defDrawFluidBackground',
        ( { defDrawFluidBackground } ) => {
          const frag = buildPlaneBackgroundFrag( defDrawFluidBackground );
          background.deferred.replaceShader( undefined, frag );
        }
      );
    }

    // == rings ====================================================================================
    const lines = new InstancedLines( fluidRingsVert, 512, 4 );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        './shaders/fluidRingsVert',
        ( { fluidRingsVert } ) => {
          lines.materials.deferred!.replaceShader( fluidRingsVert );
        },
      );
    }

    // == fluid ====================================================================================
    const fluid = new Fluid();
    fluid.transform.rotation = quatRotationX( -0.7 );

    // == stone ====================================================================================
    const geometryStone = genOctahedron( 2 );

    const stone = new RaymarcherNode( stoneFrag, { geometry: geometryStone } );
    stone.transform.scale = [ 0.3, 0.3, 0.3 ];
    stone.transform.rotation = quatMultiply( quatRotationX( 1.0 ), quatRotationY( 1.0 ) );

    const lightUniformsLambda = createLightUniformsLambda( [ stone.materials.deferred ] );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        './shaders/stoneFrag',
        ( { stoneFrag } ) => {
          const { deferred, depth } = stone.materials;

          deferred.replaceShader( objectVert, stoneFrag( 'deferred' ) );
          depth.replaceShader( objectVert, stoneFrag( 'depth' ) );
        }
      );
    }

    // == camera ===================================================================================
    const camera = new CameraStack( {
      scene,
      resources: mainCameraStackResources,
      target: cameraStackATarget,
    } );
    camera.transform.lookAt(
      [ 0.0, 0.0, 1.0 ],
      [ 0.0, 0.0, 0.0 ],
      0.3,
    );

    const lambdaCameraSpeen = new Lambda( {
      onUpdate( { time } ) {
        camera.transform.lookAt(
          [
            0.3 * Math.sin( 0.2 * time ),
            0.3 * Math.sin( 0.2 * time + 1.6 ),
            1.3,
          ],
          [ 0.0, 0.0, 0.0 ],
          0.3,
        );
      }
    } );

    fluid.forward.addUniformTextures(
      'samplerDeferredPos',
      GL_TEXTURE_2D,
      mainCameraStackResources[ 0 ].textures[ 1 ],
    );

    // == children =================================================================================
    this.children = [
      lightF,
      lightR,
      lightUniformsLambda,
      stone,
      lines,
      background,
      fluid,
      lambdaCameraSpeen,
      camera,
    ];
  }
}
