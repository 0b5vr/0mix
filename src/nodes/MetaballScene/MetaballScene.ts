import { CameraStack } from '../CameraStack/CameraStack';
import { CubemapNode } from '../CubemapNode/CubemapNode';
import { MetaballParticles } from './MetaballParticles/MetaballParticles';
import { PlaneBackground } from '../utils/PlaneBackground';
import { PointLightNode } from '../Lights/PointLightNode';
import { RaymarcherNode } from '../utils/RaymarcherNode';
import { SceneNode } from '../../heck/components/SceneNode';
import { add, def, length, mad, mix, mul, smoothstep, sw, vec3, vec4 } from '../../shaders/shaderBuilder';
import { cameraStackATarget } from '../../globals/cameraStackTargets';
import { createLightUniformsLambda } from '../utils/createLightUniformsLambda';
import { genOctahedron } from '../../geometries/genOctahedron';
import { isectInBox } from '../../shaders/modules/isectInBox';
import { mainCameraStackResources } from '../CameraStack/mainCameraStackResources';
import { metaballFrag } from './shaders/metaballFrag';
import { objectVert } from '../../shaders/common/objectVert';
import { phongSpecular } from '../../shaders/modules/phongSpecular';
import { swapShadowMap1 } from '../../globals/swapShadowMap';

export class MetaballScene extends SceneNode {
  public constructor() {
    super();

    const scene = this;
    const cubemapExclusionTag = Symbol();

    // -- lights -----------------------------------------------------------------------------------
    const light1 = new PointLightNode( {
      scene,
      swapShadowMap: swapShadowMap1,
      shadowMapFov: 40.0,
    } );
    light1.transform.lookAt( [ 0.0, 4.0, -5.0 ] );
    light1.color = [ 3000.0, 3000.0, 3000.0 ];

    if ( import.meta.env.DEV ) {
      light1.name = 'light1';
    }

    // -- metaball ---------------------------------------------------------------------------------
    const geometry = genOctahedron( 3 );

    const metaball = new RaymarcherNode( metaballFrag, {
      geometry,
      tags: [ cubemapExclusionTag ],
    } );
    metaball.transform.scale = [ 3.0, 3.0, 3.0 ];

    const lambdaLightUniforms = createLightUniformsLambda( [ metaball.materials.deferred ] );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        './shaders/metaballFrag',
        ( { metaballFrag } ) => {
          const { deferred, depth } = metaball.materials;

          deferred.replaceShader( objectVert, metaballFrag( 'deferred' ) );
          depth.replaceShader( objectVert, metaballFrag( 'depth' ) );
        },
      );
    }

    // -- particles --------------------------------------------------------------------------------
    const particles = new MetaballParticles( { tags: [ cubemapExclusionTag ] } );
    particles.transform.scale = [ 3.0, 3.0, 3.0 ];

    // -- background -------------------------------------------------------------------------------
    const background = new PlaneBackground( () => {
      return ( ro, rd ) => {
        const isect = isectInBox( ro, rd, vec3( 5.0 ) );
        const rp = def( 'vec3', mad( sw( isect, 'w' ), rd, ro ) );
        const rectlight = mul(
          mix( 0.001, 0.03, smoothstep( -3.0, -5.0, sw( rp, 'y' ) ) ),
          length( rp ),
        );

        return vec4(
          vec3( add(
            rectlight,
            phongSpecular( rd, vec3( -3.0, 0.0, 4.0 ), 100.0 ),
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
      dofParams: [ 2.5, 12.0 ],
      useAO: true,
    } );
    camera.transform.lookAt(
      [ 0.0, 0.0, 3.2 ],
      [ -0.6, 0.0, 0.0 ],
    );

    // -- children ---------------------------------------------------------------------------------
    this.children = [
      light1,
      lambdaLightUniforms,
      metaball,
      particles,
      background,
      cubemapNode,
      camera,
    ];
  }
}
