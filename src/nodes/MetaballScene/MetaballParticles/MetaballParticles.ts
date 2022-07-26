import { GL_TEXTURE_2D } from '../../../gl/constants';
import { GPUParticles } from '../../utils/GPUParticles';
import { METABALL_PARTICLES_COUNT, METABALL_PARTICLES_COUNT_SQRT } from './constants';
import { Material } from '../../../heck/Material';
import { auto } from '../../../globals/automaton';
import { dummyRenderTarget2, dummyRenderTarget4 } from '../../../globals/dummyRenderTarget';
import { genOctahedron } from '../../../geometries/genOctahedron';
import { glCreateVertexbuffer } from '../../../gl/glCreateVertexbuffer';
import { glVertexArrayBindVertexbuffer } from '../../../gl/glVertexArrayBindVertexbuffer';
import { metaballParticlesComputeFrag } from './shaders/metaballParticlesComputeFrag';
import { metaballParticlesRenderFrag } from './shaders/metaballParticlesRenderFrag';
import { metaballParticlesRenderVert } from './shaders/metaballParticlesRenderVert';
import { music } from '../../../globals/music';
import { quadGeometry } from '../../../globals/quadGeometry';
import { quadVert } from '../../../shaders/common/quadVert';
import { randomTexture, randomTextureStatic } from '../../../globals/randomTexture';

export class MetaballParticles extends GPUParticles {
  public constructor() {
    // -- material compute -------------------------------------------------------------------------
    const materialCompute = new Material(
      quadVert,
      metaballParticlesComputeFrag,
      { initOptions: { geometry: quadGeometry, target: dummyRenderTarget2 } },
    );

    materialCompute.addUniformTextures( 'samplerRandom', GL_TEXTURE_2D, randomTexture.texture );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        './shaders/metaballParticlesComputeFrag',
        ( { metaballParticlesComputeFrag } ) => {
          materialCompute.replaceShader(
            undefined,
            metaballParticlesComputeFrag,
          );
        },
      );
    }

    // -- geometry render --------------------------------------------------------------------------
    const geometry = genOctahedron( 0 );

    const arrayComputeUV = new Float32Array( 2 * METABALL_PARTICLES_COUNT );

    for ( let iy = 0; iy < METABALL_PARTICLES_COUNT_SQRT; iy ++ ) {
      for ( let ix = 0; ix < METABALL_PARTICLES_COUNT_SQRT; ix ++ ) {
        const i = ix + iy * METABALL_PARTICLES_COUNT_SQRT;
        const s = ( ix + 0.5 ) / METABALL_PARTICLES_COUNT_SQRT;
        const t = ( iy + 0.5 ) / METABALL_PARTICLES_COUNT_SQRT;
        arrayComputeUV[ i * 2 + 0 ] = s;
        arrayComputeUV[ i * 2 + 1 ] = t;
      }
    }

    const bufferComputeUV = glCreateVertexbuffer( arrayComputeUV );

    glVertexArrayBindVertexbuffer( geometry.vao, bufferComputeUV, 3, 2, 1 );

    geometry.primcount = METABALL_PARTICLES_COUNT;

    // -- material render --------------------------------------------------------------------------
    const deferred = new Material(
      metaballParticlesRenderVert,
      metaballParticlesRenderFrag,
      {
        initOptions: { geometry, target: dummyRenderTarget4 },
      },
    );

    // it's too expensive
    // const depth = new Material(
    //   metaballParticlesRenderVert,
    //   depthFrag,
    //   { initOptions: { geometry, target: dummyRenderTarget1 } },
    // );

    deferred.addUniformTextures(
      'samplerRandomStatic',
      GL_TEXTURE_2D,
      randomTextureStatic.texture,
    );
    // depth.addUniformTextures(
    //   'samplerRandomStatic',
    //   GL_TEXTURE_2D,
    //   randomTextureStatic.texture,
    // );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        [
          './shaders/metaballParticlesRenderVert',
          './shaders/metaballParticlesRenderFrag',
        ],
        ( [ v, f ] ) => {
          deferred.replaceShader( v?.metaballParticlesRenderVert, f?.metaballParticlesRenderFrag );
          // depth.replaceShader( v?.metaballParticlesRenderVert, undefined );
        },
      );
    }

    // -- gpu particles ----------------------------------------------------------------------------
    super( {
      materialCompute,
      geometryRender: geometry,
      materialsRender: {
        deferred,
        // depth,
      },
      computeWidth: METABALL_PARTICLES_COUNT_SQRT,
      computeHeight: METABALL_PARTICLES_COUNT_SQRT,
      computeNumBuffers: 2,
    } );

    auto( 'MetaballScene/Particles/update', () => {
      const { time, deltaTime } = music;
      this.updateParticles( { time, deltaTime } );
    } );

    if ( import.meta.env.DEV ) {
      this.swapCompute.i.name = 'MetaballParticles/swap/0';
      this.swapCompute.o.name = 'MetaballParticles/swap/1';
    }
  }
}
