import { CameraStack } from '../CameraStack/CameraStack';
import { CubemapNode } from '../CubemapNode/CubemapNode';
import { GL_TEXTURE_2D } from '../../gl/constants';
import { GPUParticles } from '../utils/GPUParticles';
import { MTL_PBR_EMISSIVE3_ROUGHNESS, MTL_PBR_ROUGHNESS_METALLIC } from '../CameraStack/deferredConstants';
import { Material } from '../../heck/Material';
import { Mesh } from '../../heck/components/Mesh';
import { PARTICLES_COUNT, PARTICLES_COUNT_SQRT } from './constants';
import { PointLightNode } from '../Lights/PointLightNode';
import { RaymarcherNode } from '../utils/RaymarcherNode';
import { SceneNode } from '../../heck/components/SceneNode';
import { auto } from '../../globals/automaton';
import { cameraStackATarget } from '../../globals/cameraStackTargets';
import { deferredColorFrag } from '../../shaders/common/deferredColorFrag';
import { depthFrag } from '../../shaders/common/depthFrag';
import { dummyRenderTarget1, dummyRenderTarget2, dummyRenderTarget4 } from '../../globals/dummyRenderTarget';
import { genOctahedron } from '../../geometries/genOctahedron';
import { genTorus } from '../../geometries/genTorus';
import { glCreateVertexbuffer } from '../../gl/glCreateVertexbuffer';
import { glVertexArrayBindVertexbuffer } from '../../gl/glVertexArrayBindVertexbuffer';
import { mainCameraStackResources } from '../CameraStack/mainCameraStackResources';
import { music } from '../../globals/music';
import { objectVert } from '../../shaders/common/objectVert';
import { particlesComputeFrag } from './shaders/particlesComputeFrag';
import { particlesRenderVert } from './shaders/particlesRenderVert';
import { quadGeometry } from '../../globals/quadGeometry';
import { quadVert } from '../../shaders/common/quadVert';
import { randomTexture, randomTextureStatic } from '../../globals/randomTexture';
import { sphereFrag } from './shaders/sphereFrag';
import { swapShadowMap1, swapShadowMap2 } from '../../globals/swapShadowMap';

export class ParticlesRingScene extends SceneNode {
  public constructor() {
    super();

    const scene = this;
    const cubemapExclusionTag = Symbol();

    // -- lights -----------------------------------------------------------------------------------
    const light1 = new PointLightNode( {
      scene,
      swapShadowMap: swapShadowMap1,
      shadowMapFov: 30.0,
    } );
    light1.transform.lookAt( [ 1.0, -0.5, 3.0 ] );
    light1.color = [ 100.0, 100.0, 100.0 ];

    const light2 = new PointLightNode( {
      scene,
      swapShadowMap: swapShadowMap2,
      shadowMapFov: 30.0,
    } );
    light2.transform.lookAt( [ -5.0, 2.0, 2.0 ] );
    light2.color = [ 100.0, 100.0, 100.0 ];

    if ( import.meta.env.DEV ) {
      light1.name = 'light1';
      light2.name = 'light2';
    }

    // -- sphere -----------------------------------------------------------------------------------
    const sphere = new RaymarcherNode(
      sphereFrag,
      { geometry: genOctahedron( 3 ) },
    );
    sphere.tags.push( cubemapExclusionTag );
    sphere.transform.scale = [ 1.0, 1.0, 1.0 ];

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        './shaders/sphereFrag',
        ( { sphereFrag } ) => {
          const { deferred, depth } = sphere.materials;

          deferred.replaceShader( objectVert, sphereFrag( 'deferred' ) );
          depth.replaceShader( objectVert, sphereFrag( 'depth' ) );
        },
      );
    }

    // -- torus ------------------------------------------------------------------------------------
    let meshTorus: Mesh;

    {
      const geometry = genTorus( 1.5, 0.01 );

      const deferred = new Material(
        objectVert,
        deferredColorFrag,
        { initOptions: { geometry, target: dummyRenderTarget4 } },
      );

      deferred.addUniform( 'color', '4f', 0.0, 0.0, 0.0, 1.0 );
      deferred.addUniform( 'mtlKind', '1f', MTL_PBR_EMISSIVE3_ROUGHNESS );
      deferred.addUniform( 'mtlParams', '4f', 1.0, 1.0, 1.0, 0.0 );

      meshTorus = new Mesh( {
        geometry,
        materials: { deferred },
      } );
    }

    // -- particles --------------------------------------------------------------------------------
    let particles: GPUParticles;

    {
      // :: material compute :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
      const materialCompute = new Material(
        quadVert,
        particlesComputeFrag,
        { initOptions: { geometry: quadGeometry, target: dummyRenderTarget2 } },
      );

      materialCompute.addUniformTextures( 'samplerRandom', GL_TEXTURE_2D, randomTexture.texture );

      if ( import.meta.hot ) {
        import.meta.hot.accept(
          './shaders/particlesComputeFrag',
          ( { particlesComputeFrag } ) => {
            materialCompute.replaceShader(
              undefined,
              particlesComputeFrag,
            );
          },
        );
      }

      // :: geometry :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
      const geometry = genOctahedron( 1 );

      const arrayComputeUV = new Float32Array( 2 * PARTICLES_COUNT );

      for ( let iy = 0; iy < PARTICLES_COUNT_SQRT; iy ++ ) {
        for ( let ix = 0; ix < PARTICLES_COUNT_SQRT; ix ++ ) {
          const i = ix + iy * PARTICLES_COUNT_SQRT;
          const s = ( ix + 0.5 ) / PARTICLES_COUNT_SQRT;
          const t = ( iy + 0.5 ) / PARTICLES_COUNT_SQRT;
          arrayComputeUV[ i * 2 + 0 ] = s;
          arrayComputeUV[ i * 2 + 1 ] = t;
        }
      }

      const bufferComputeUV = glCreateVertexbuffer( arrayComputeUV );

      glVertexArrayBindVertexbuffer( geometry.vao, bufferComputeUV, 3, 2, 1 );

      geometry.primcount = PARTICLES_COUNT;

      // :: material render ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
      const deferred = new Material(
        particlesRenderVert,
        deferredColorFrag,
        {
          initOptions: { geometry, target: dummyRenderTarget4 },
        },
      );

      const depth = new Material(
        particlesRenderVert,
        depthFrag,
        { initOptions: { geometry, target: dummyRenderTarget1 } },
      );

      deferred.addUniform( 'color', '4f', 0.1, 0.1, 0.1, 1.0 );
      deferred.addUniform( 'mtlKind', '1f', MTL_PBR_ROUGHNESS_METALLIC );
      deferred.addUniform( 'mtlParams', '4f', 0.1, 1.0, 0.0, 0.0 );

      deferred.addUniformTextures(
        'samplerRandomStatic',
        GL_TEXTURE_2D,
        randomTextureStatic.texture,
      );
      depth.addUniformTextures(
        'samplerRandomStatic',
        GL_TEXTURE_2D,
        randomTextureStatic.texture,
      );

      if ( import.meta.hot ) {
        import.meta.hot.accept(
          './shaders/particlesRenderVert',
          ( { particlesRenderVert } ) => {
            deferred.replaceShader( particlesRenderVert, undefined );
            depth.replaceShader( particlesRenderVert, undefined );
          },
        );
      }

      // :: gpu particles ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
      particles = new GPUParticles( {
        materialCompute,
        geometryRender: geometry,
        materialsRender: {
          deferred,
          depth,
        },
        computeWidth: PARTICLES_COUNT_SQRT,
        computeHeight: PARTICLES_COUNT_SQRT,
        computeNumBuffers: 2,
      } );

      if ( import.meta.env.DEV ) {
        particles.swapCompute.i.name = 'ParticlesRingScene/swap/0';
        particles.swapCompute.o.name = 'ParticlesRingScene/swap/1';
      }
    }

    // -- cubemap ----------------------------------------------------------------------------------
    const cubemapNode = new CubemapNode( {
      scene,
      exclusionTags: [ cubemapExclusionTag ],
    } );

    // -- camera -----------------------------------------------------------------------------------
    const camera = new CameraStack( {
      scene,
      cubemapNode,
      resources: mainCameraStackResources,
      target: cameraStackATarget,
      useAO: true,
      dofParams: [ 5.0, 16.0 ],
    } );
    camera.transform.lookAt( [ 0.0, 0.0, 5.0 ] );

    auto( 'ParticlesRingScene/CameraZ', ( { value } ) => {
      camera.transform.position = [ 0.0, 0.0, value ];
      camera.dof!.params[ 0 ] = value;
    } );

    // -- auto -------------------------------------------------------------------------------------
    auto( 'ParticlesRingScene/Particles/update', () => {
      const { time, deltaTime } = music;
      particles.updateParticles( { time, deltaTime } );
    } );

    // -- children ---------------------------------------------------------------------------------
    this.children = [
      light1,
      light2,
      sphere,
      meshTorus,
      particles,
      cubemapNode,
      camera,
    ];
  }
}
