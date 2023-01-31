import { CameraStack } from '../CameraStack/CameraStack';
import { GL_TEXTURE_2D } from '../../gl/constants';
import { GPUParticles } from '../utils/GPUParticles';
import { MTL_PBR_ROUGHNESS_METALLIC } from '../CameraStack/deferredConstants';
import { Material } from '../../heck/Material';
import { PARTICLES_COUNT, PARTICLES_COUNT_SQRT } from './constants';
import { PointLightNode } from '../Lights/PointLightNode';
import { SceneNode } from '../../heck/components/SceneNode';
import { auto } from '../../globals/automaton';
import { cameraStackATarget } from '../../globals/cameraStackTargets';
import { deferredColorFrag } from '../../shaders/common/deferredColorFrag';
import { depthFrag } from '../../shaders/common/depthFrag';
import { dummyRenderTarget1, dummyRenderTarget2, dummyRenderTarget4 } from '../../globals/dummyRenderTarget';
import { genOctahedron } from '../../geometries/genOctahedron';
import { glCreateVertexbuffer } from '../../gl/glCreateVertexbuffer';
import { glVertexArrayBindVertexbuffer } from '../../gl/glVertexArrayBindVertexbuffer';
import { mainCameraStackResources } from '../CameraStack/mainCameraStackResources';
import { music } from '../../globals/music';
import { particlesComputeFrag } from './shaders/particlesComputeFrag';
import { particlesRenderVert } from './shaders/particlesRenderVert';
import { quadGeometry } from '../../globals/quadGeometry';
import { quadVert } from '../../shaders/common/quadVert';
import { randomTexture, randomTextureStatic } from '../../globals/randomTexture';
import { swapShadowMap1, swapShadowMap2, swapShadowMap3 } from '../../globals/swapShadowMap';

export class ParticlesRingScene extends SceneNode {
  public constructor() {
    super();

    const scene = this;

    // -- lights -----------------------------------------------------------------------------------
    const light1 = new PointLightNode( {
      scene,
      swapShadowMap: swapShadowMap1,
      shadowMapFov: 30.0,
    } );
    light1.transform.lookAt( [ 3.0, -0.5, 3.0 ] );
    light1.color = [ 100.0, 100.0, 100.0 ];

    const light2 = new PointLightNode( {
      scene,
      swapShadowMap: swapShadowMap2,
      shadowMapFov: 30.0,
    } );
    light2.transform.lookAt( [ -3.0, 2.0, 3.0 ] );
    light2.color = [ 100.0, 100.0, 100.0 ];

    const light3 = new PointLightNode( {
      scene,
      swapShadowMap: swapShadowMap3,
      shadowMapFov: 30.0,
    } );
    light3.transform.lookAt( [ 0.0, 5.0, 0.0 ] );
    light3.color = [ 100.0, 100.0, 100.0 ];

    if ( import.meta.env.DEV ) {
      light1.name = 'light1';
      light2.name = 'light2';
      light3.name = 'light3';
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
        particles.swapCompute.i.name = 'ParticlesStudioScene/swap/0';
        particles.swapCompute.o.name = 'ParticlesStudioScene/swap/1';
      }
    }

    // -- camera -----------------------------------------------------------------------------------
    const camera = new CameraStack( {
      scene,
      resources: mainCameraStackResources,
      target: cameraStackATarget,
      useAO: true,
      dofParams: [ 6.0, 12.0 ],
    } );
    camera.transform.lookAt(
      [ 0.0, 0.0, 6.0 ],
    );

    // -- auto -------------------------------------------------------------------------------------
    auto( 'ParticlesStudioScene/Particles/update', () => {
      const { time, deltaTime } = music;
      particles.updateParticles( { time, deltaTime } );
    } );

    // -- children ---------------------------------------------------------------------------------
    this.children = [
      light1,
      light2,
      light3,
      particles,
      camera,
    ];
  }
}
