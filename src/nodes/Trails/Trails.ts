import { GPUParticles } from '../utils/GPUParticles';
import { Lambda } from '../../heck/components/Lambda';
import { MTL_PBR_ROUGHNESS_METALLIC } from '../CameraStack/shaders/deferredShadeFrag';
import { Material } from '../../heck/Material';
import { TransparentShell } from '../_misc/TransparentShell';
import { auto } from '../../globals/automaton';
import { dummyRenderTarget1, dummyRenderTarget2, dummyRenderTarget4 } from '../../globals/dummyRenderTarget';
import { genCylinder } from '../../geometries/genCylinder';
import { quadGeometry } from '../../globals/quadGeometry';
import { quadVert } from '../../shaders/common/quadVert';
import { randomTexture, randomTextureStatic } from '../../globals/randomTexture';
import { trailsComputeFrag } from './shaders/trailsComputeFrag';
import { trailsRenderFrag } from './shaders/trailsRenderFrag';
import { trailsRenderVert } from './shaders/trailsRenderVert';
import { glVertexArrayBindVertexbuffer } from '../../gl/glVertexArrayBindVertexbuffer';
import { GL_TEXTURE_2D } from '../../gl/constants';
import { glCreateVertexbuffer } from '../../gl/glCreateVertexbuffer';

const trails = 512;
const trailLength = 512;

const trailSpawnLength = 4.0;

const materialOptions = { trails, trailLength, trailSpawnLength };

export class Trails extends GPUParticles {
  public constructor() {
    // -- material compute -------------------------------------------------------------------------
    const materialCompute = new Material(
      quadVert,
      trailsComputeFrag( materialOptions ),
      { initOptions: { geometry: quadGeometry, target: dummyRenderTarget2 } },
    );

    const shouldUpdate = 1;

    materialCompute.addUniform( 'shouldUpdate', '1i', shouldUpdate );
    materialCompute.addUniformTextures( 'samplerRandom', GL_TEXTURE_2D, randomTexture.texture );

    if ( import.meta.hot ) {
      import.meta.hot.accept( '../shaders/trailsComputeFrag', ( { trailsComputeFrag } ) => {
        materialCompute.replaceShader(
          quadVert,
          trailsComputeFrag( materialOptions ),
        );
      } );
    }

    // -- geometry render --------------------------------------------------------------------------
    const { geometry } = genCylinder( {
      heightSegs: trailLength,
      radialSegs: 16,
    } );

    const bufferComputeV = glCreateVertexbuffer( ( () => {
      const ret = new Float32Array( trails );
      for ( let i = 0; i < trails; i ++ ) {
        const s = ( i + 0.5 ) / trails;
        ret[ i ] = s;
      }
      return ret;
    } )() );

    glVertexArrayBindVertexbuffer( geometry.vao, bufferComputeV, 3, 1, 1 );

    geometry.primcount = trails;

    // -- material render --------------------------------------------------------------------------
    const deferred = new Material(
      trailsRenderVert( trailLength ),
      trailsRenderFrag( 'deferred' ),
      {
        initOptions: { geometry, target: dummyRenderTarget4 },
      },
    );
    deferred.addUniform( 'color', '4f', 0.6, 0.7, 0.8, 1.0 );
    deferred.addUniform( 'mtlKind', '1f', MTL_PBR_ROUGHNESS_METALLIC );
    deferred.addUniform( 'mtlParams', '4f', 0.8, 1.0, 0.0, 0.0 );

    const depth = new Material(
      trailsRenderVert( trailLength ),
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
        ( [ { trailsRenderVert }, { trailsRenderFrag } ] ) => {
          deferred.replaceShader(
            trailsRenderVert( trailLength ),
            trailsRenderFrag( 'deferred' ),
          );
          depth.replaceShader(
            trailsRenderVert( trailLength ),
            trailsRenderFrag( 'depth' ),
          );
        },
      );
    }

    // -- gpu particles ----------------------------------------------------------------------------
    super( {
      materialCompute,
      geometryRender: geometry,
      materialsRender: { deferred, depth },
      computeWidth: trailLength,
      computeHeight: trails,
      computeNumBuffers: 2,
    } );

    // -- lambda to say update ---------------------------------------------------------------------
    let shouldInit = 0;

    auto( 'trails/init', () => {
      shouldInit = 1;
    } );

    const lambdaUpdateShouldUpdate = new Lambda( {
      onUpdate: ( { time, deltaTime } ) => {
        const shouldUpdate
          = Math.floor( 60.0 * time ) !== Math.floor( 60.0 * ( time - deltaTime ) );
        materialCompute.addUniform( 'shouldUpdate', '1i', shouldUpdate ? 1 : 0 );

        materialCompute.addUniform( 'shouldInit', '1i', shouldInit );
        shouldInit = 0;
      },
    } );

    if ( import.meta.env.DEV ) {
      lambdaUpdateShouldUpdate.name = 'lambdaUpdateShouldUpdate';
    }

    this.children.push( lambdaUpdateShouldUpdate );

    // -- shell ------------------------------------------------------------------------------------
    this.children.push( new TransparentShell() );
  }
}
