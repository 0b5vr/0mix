import { GL_POINTS, GL_TEXTURE_2D } from '../../gl/constants';
import { GPUParticles } from '../utils/GPUParticles';
import { Geometry } from '../../heck/Geometry';
import { Material } from '../../heck/Material';
import { RawVector4 } from '@0b5vr/experimental';
import { auto } from '../../globals/automaton';
import { createLightUniformsLambda } from '../utils/createLightUniformsLambda';
import { dummyRenderTarget1, dummyRenderTarget2 } from '../../globals/dummyRenderTarget';
import { dustComputeFrag } from './shaders/dustComputeFrag';
import { dustRenderFrag } from './shaders/dustRenderFrag';
import { dustRenderVert } from './shaders/dustRenderVert';
import { glCreateVertexbuffer } from '../../gl/glCreateVertexbuffer';
import { glVertexArrayBindVertexbuffer } from '../../gl/glVertexArrayBindVertexbuffer';
import { music } from '../../globals/music';
import { quadGeometry } from '../../globals/quadGeometry';
import { quadVert } from '../../shaders/common/quadVert';
import { randomTexture } from '../../globals/randomTexture';

const particlesSqrt = 256;
const particles = particlesSqrt * particlesSqrt;

const particleSpawnLength = 4.0;

const materialOptions = { particlesSqrt, particleSpawnLength };

export const DustTag = Symbol();

export class Dust extends GPUParticles {
  public constructor( color: RawVector4 ) {
    // -- material compute -------------------------------------------------------------------------
    const materialCompute = new Material(
      quadVert,
      dustComputeFrag( materialOptions ),
      { initOptions: { geometry: quadGeometry, target: dummyRenderTarget2 } },
    );

    materialCompute.addUniformTextures( 'samplerRandom', GL_TEXTURE_2D, randomTexture.texture );

    if ( import.meta.hot ) {
      import.meta.hot.accept( './shaders/dustComputeFrag', ( { dustComputeFrag } ) => {
        materialCompute.replaceShader(
          quadVert,
          dustComputeFrag( materialOptions ),
        );
      } );
    }

    // -- geometry render --------------------------------------------------------------------------
    const geometry = new Geometry();

    const bufferComputeUV = glCreateVertexbuffer( ( () => {
      const ret = new Float32Array( 2 * particles );
      for ( let iy = 0; iy < particlesSqrt; iy ++ ) {
        for ( let ix = 0; ix < particlesSqrt; ix ++ ) {
          const i = ix + iy * particlesSqrt;
          const s = ( ix + 0.5 ) / particlesSqrt;
          const t = ( iy + 0.5 ) / particlesSqrt;
          ret[ i * 2 + 0 ] = s;
          ret[ i * 2 + 1 ] = t;
        }
      }
      return ret;
    } )() );

    glVertexArrayBindVertexbuffer( geometry.vao, bufferComputeUV, 0, 2 );

    geometry.count = particles;
    geometry.mode = GL_POINTS;

    // -- material render --------------------------------------------------------------------------
    const forward = new Material(
      dustRenderVert,
      dustRenderFrag,
      {
        initOptions: { geometry, target: dummyRenderTarget1 },
      },
    );

    forward.addUniform( 'color', '4f', ...color );

    const lambdaLightUniforms = createLightUniformsLambda( [ forward ] );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        [
          './shaders/dustRenderVert',
          './shaders/dustRenderFrag',
        ],
        ( [ v, f ] ) => {
          forward.replaceShader( v?.dustRenderVert, f?.dustRenderFrag );
        },
      );
    }

    // -- gpu particles ----------------------------------------------------------------------------
    super( {
      materialCompute,
      geometryRender: geometry,
      materialsRender: { forward },
      computeWidth: particlesSqrt,
      computeHeight: particlesSqrt,
      computeNumBuffers: 2,
      tags: [ DustTag ],
    } );

    auto( 'Dust/update', () => {
      const { time, deltaTime } = music;
      this.updateParticles( { time, deltaTime } );
    } );

    if ( import.meta.env.DEV ) {
      this.swapCompute.i.name = 'Dust/swap/0';
      this.swapCompute.o.name = 'Dust/swap/1';
    }

    this.children.unshift( lambdaLightUniforms );
  }
}
