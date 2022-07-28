import { GL_TEXTURE_2D } from '../../../gl/constants';
import { GPUParticles } from '../../utils/GPUParticles';
import { MTL_PBR_ROUGHNESS_METALLIC } from '../../CameraStack/deferredConstants';
import { Material } from '../../../heck/Material';
import { TRAILS_COUNT, TRAILS_LENGTH } from './constants';
import { auto } from '../../../globals/automaton';
import { dummyRenderTarget1, dummyRenderTarget2, dummyRenderTarget4 } from '../../../globals/dummyRenderTarget';
import { genCylinder } from '../../../geometries/genCylinder';
import { glCreateVertexbuffer } from '../../../gl/glCreateVertexbuffer';
import { glVertexArrayBindVertexbuffer } from '../../../gl/glVertexArrayBindVertexbuffer';
import { music } from '../../../globals/music';
import { quadGeometry } from '../../../globals/quadGeometry';
import { quadVert } from '../../../shaders/common/quadVert';
import { randomTexture, randomTextureStatic } from '../../../globals/randomTexture';
import { trailsComputeFrag } from './shaders/trailsComputeFrag';
import { trailsRenderFrag } from './shaders/trailsRenderFrag';
import { trailsRenderVert } from './shaders/trailsRenderVert';

export class Trails extends GPUParticles {
  public constructor() {
    // -- material compute -------------------------------------------------------------------------
    const materialCompute = new Material(
      quadVert,
      trailsComputeFrag,
      { initOptions: { geometry: quadGeometry, target: dummyRenderTarget2 } },
    );

    const shouldUpdate = 1;

    materialCompute.addUniform( 'shouldUpdate', '1i', shouldUpdate );
    materialCompute.addUniformTextures( 'samplerRandom', GL_TEXTURE_2D, randomTexture.texture );

    if ( import.meta.hot ) {
      import.meta.hot.accept( './shaders/trailsComputeFrag', ( { trailsComputeFrag } ) => {
        materialCompute.replaceShader(
          quadVert,
          trailsComputeFrag,
        );
      } );
    }

    // -- geometry render --------------------------------------------------------------------------
    const geometry = genCylinder( {
      heightSegs: TRAILS_LENGTH,
      radialSegs: 16,
    } );

    const bufferComputeV = glCreateVertexbuffer( ( () => {
      const ret = new Float32Array( TRAILS_COUNT );
      for ( let i = 0; i < TRAILS_COUNT; i ++ ) {
        const s = ( i + 0.5 ) / TRAILS_COUNT;
        ret[ i ] = s;
      }
      return ret;
    } )() );

    glVertexArrayBindVertexbuffer( geometry.vao, bufferComputeV, 3, 1, 1 );

    geometry.primcount = TRAILS_COUNT;

    // -- material render --------------------------------------------------------------------------
    const deferred = new Material(
      trailsRenderVert,
      trailsRenderFrag( 'deferred' ),
      {
        initOptions: { geometry, target: dummyRenderTarget4 },
      },
    );
    deferred.addUniform( 'color', '4f', 0.6, 0.7, 0.8, 1.0 );
    deferred.addUniform( 'mtlKind', '1f', MTL_PBR_ROUGHNESS_METALLIC );
    deferred.addUniform( 'mtlParams', '4f', 0.8, 1.0, 0.0, 0.0 );

    const depth = new Material(
      trailsRenderVert,
      trailsRenderFrag( 'depth' ),
      { initOptions: { geometry, target: dummyRenderTarget1 } },
    );

    deferred.addUniformTextures( 'samplerRandomStatic', GL_TEXTURE_2D, randomTextureStatic.texture );
    depth.addUniformTextures( 'samplerRandomStatic', GL_TEXTURE_2D, randomTextureStatic.texture );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        [
          './shaders/trailsRenderVert',
          './shaders/trailsRenderFrag',
        ],
        ( [ v, f ] ) => {
          deferred.replaceShader(
            v?.trailsRenderVert,
            f?.trailsRenderFrag( 'deferred' ),
          );
          depth.replaceShader(
            v?.trailsRenderVert,
            f?.trailsRenderFrag( 'depth' ),
          );
        },
      );
    }

    // -- gpu particles ----------------------------------------------------------------------------
    super( {
      materialCompute,
      geometryRender: geometry,
      materialsRender: { deferred, depth },
      computeWidth: TRAILS_LENGTH,
      computeHeight: TRAILS_COUNT,
      computeNumBuffers: 2,
    } );

    // -- lambda to say update ---------------------------------------------------------------------
    let shouldInit = 0;

    auto( 'trails/init', () => {
      shouldInit = 1;
    } );

    auto( 'Trails/Particles/update', () => {
      const { time, deltaTime } = music;

      const shouldUpdate
        = ~~( 60.0 * time ) !== ~~( 60.0 * ( time - deltaTime ) );
      materialCompute.addUniform( 'shouldUpdate', '1i', shouldUpdate ? 1 : 0 );

      materialCompute.addUniform( 'shouldInit', '1i', shouldInit );
      shouldInit = 0;

      this.updateParticles( { time, deltaTime } );
    } );

    if ( import.meta.env.DEV ) {
      this.swapCompute.i.name = 'Trails/swap/0';
      this.swapCompute.o.name = 'Trails/swap/1';
    }
  }
}
