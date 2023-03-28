import { CameraStack } from '../CameraStack/CameraStack';
import { CubemapNode } from '../CubemapNode/CubemapNode';
import { PlaneBackground } from '../utils/PlaneBackground';
import { PointLightNode } from '../Lights/PointLightNode';
import { RaymarcherNode } from '../utils/RaymarcherNode';
import { SceneNode } from '../../heck/components/SceneNode';
import { abs, add, mad, mul, mulAssign, sign, smoothstep, step, subAssign, sw, vec3, vec4 } from '../../shaders/shaderBuilder';
import { cameraStackATarget } from '../../globals/cameraStackTargets';
import { genOctahedron } from '../../geometries/genOctahedron';
import { icosahedronFrag } from './shaders/icosahedronFrag';
import { isectPlane } from '../../shaders/modules/isectPlane';
import { mainCameraStackResources } from '../CameraStack/mainCameraStackResources';
import { objectVert } from '../../shaders/common/objectVert';
import { swapShadowMap1, swapShadowMap2 } from '../../globals/swapShadowMap';

export class IcosahedronScene extends SceneNode {
  public constructor() {
    super();

    const scene = this;
    const cubemapExclusionTag = Symbol();

    // -- light ------------------------------------------------------------------------------------
    const light1 = new PointLightNode( {
      scene,
      swapShadowMap: swapShadowMap1,
      shadowMapFov: 20.0,
    } );
    light1.transform.lookAt( [ -2.0, 3.0, 5.0 ] );
    light1.color = [ 100.0, 100.0, 100.0 ];

    const light2 = new PointLightNode( {
      scene,
      swapShadowMap: swapShadowMap2,
    } );
    light2.transform.lookAt( [ 0.0, -5.0, 5.0 ] );
    light2.color = [ 10.0, 10.0, 10.0 ];

    if ( import.meta.env.DEV ) {
      light1.name = 'light1';
      light2.name = 'light2';
    }

    // -- geometry ---------------------------------------------------------------------------------
    const geometry = genOctahedron( 2 );

    // -- raymarcher -------------------------------------------------------------------------------
    const raymarcher = new RaymarcherNode( icosahedronFrag, {
      geometry,
      tags: [ cubemapExclusionTag ],
    } );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        './shaders/icosahedronFrag',
        ( { icosahedronFrag } ) => {
          const { deferred, depth } = raymarcher.materials;

          deferred.replaceShader( objectVert, icosahedronFrag( 'deferred' ) );
          depth.replaceShader( objectVert, icosahedronFrag( 'depth' ) );
        },
      );
    }

    // -- background -------------------------------------------------------------------------------
    const background = new PlaneBackground( () => {
      return ( ro, rd ) => {
        mulAssign( sw( ro, 'y' ), sign( sw( rd, 'y' ) ) );
        mulAssign( sw( rd, 'y' ), sign( sw( rd, 'y' ) ) );
        subAssign( sw( ro, 'y' ), 5.0 );

        const isect = isectPlane( ro, rd, vec3( 0.0, -1.0, 0.0 ) );
        const rp = mad( isect, rd, ro );
        const shape = mul( step( abs( sw( rp, 'z' ) ), 1.0 ) );

        return vec4(
          vec3( add(
            mul( 0.04, smoothstep( 0.5, 0.0, sw( rd, 'y' ) ) ), // bg
            shape,
          ) ),
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
      useAO: true,
      dofParams: [ 0.6, 16.0 ],
    } );
    camera.transform.lookAt(
      [ -0.3, 0.0, 1.2 ],
      [ -0.3, 0.3, 0.0 ],
      0.2,
    );

    // -- children ---------------------------------------------------------------------------------
    this.children = [
      light1,
      light2,
      raymarcher,
      background,
      cubemapNode,
      camera,
    ];
  }
}
