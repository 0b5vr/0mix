import { GLSLExpression, abs, add, addAssign, assign, build, def, defFn, defInNamed, defOutNamed, defUniformNamed, div, float, gt, ifThen, insert, length, main, max, min, mix, mul, mulAssign, normalize, retFn, sqrt, sub, sw, tan, texture, unrollLoop, vec2, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { PI } from '../../../utils/constants';
import { glslDefRandom } from '../../../shaders/modules/glslDefRandom';
import { glslLofi } from '../../../shaders/modules/glslLofi';
import { glslSaturate } from '../../../shaders/modules/glslSaturate';
import { liftGammaGain } from '../../../shaders/modules/liftGammaGain';
import { sRGBOETF } from '../../../shaders/modules/sRGBOETF';
import { tonemapACESHill } from '../../../shaders/modules/tonemapACESHill';

const BARREL_ITER = 10;
const BARREL_OFFSET = 0.03;
const BARREL_AMP = 0.03;

const LIFT = vec4( -0.03, 0.01, 0.05, 0.0 );
const GAMMA = vec4( -0.02, 0.02, -0.01, 0.0 );
const GAIN = vec4( 1.04, 0.98, 1.02, 1.0 );

export const postFrag = build( () => {
  insert( 'precision highp float;' );

  const fragColor = defOutNamed( 'vec4', 'fragColor' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const mosaicAmp = defUniformNamed( 'float', 'mosaicAmp' );
  const mixInvert = defUniformNamed( 'float', 'mixInvert' );
  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const sampler0 = defUniformNamed( 'sampler2D', 'sampler0' );
  const samplerRandom = defUniformNamed( 'sampler2D', 'samplerRandom' );

  const { init, random } = glslDefRandom();

  const barrel = defFn( 'vec3', [ 'float', 'vec2' ], ( amp, uv ) => {
    const corn = def( 'float', length( vec2( 0.5 ) ) );
    const a = def( 'float', min( mul( 3.0, sqrt( amp ) ), mul( corn, PI ) ) );
    const zoom = def( 'float', div( corn, add( tan( mul( corn, a ) ), corn ) ) );
    const uvt = sub( uv, 0.5 );
    const p = glslSaturate( add(
      mul( add( uv, mul( normalize( uvt ), tan( mul( length( uvt ), a ) ) ) ), zoom ),
      mul( 0.5, sub( 1.0, zoom ) )
    ) ) as GLSLExpression<'vec2'>;
    retFn( sw( texture( sampler0, p ), 'xyz' ) );
  } );

  main( () => {
    const uv = def( 'vec2', vUv );

    init( texture( samplerRandom, uv ) );

    const mosaic = mul( mosaicAmp, sw( resolution, 'y' ) );
    ifThen( gt( mosaic, 1.0 ), () => {
      assign( uv, add(
        glslLofi( sub( uv, 0.5 ), div( mosaic, resolution ) ) as GLSLExpression<'vec2'>,
        mul( mosaic, div( 0.5, resolution ) ),
        0.5
      ) );
    } );

    const aspect = div( sw( resolution, 'x' ), sw( resolution, 'y' ) );
    const p = def( 'vec2', sub( mul( uv, 2.0 ), 1.0 ) );
    mulAssign( sw( p, 'x' ), aspect );

    const vig = sub( 1.0, mul( 0.2, length( p ) ) );

    const tex = def( 'vec3', vec3( 0.0 ) );

    unrollLoop( BARREL_ITER, ( i ) => {
      const phase = div( add( float( i ), 0.5 ), BARREL_ITER );
      const a = mul(
        glslSaturate( sub( 1.0, mul( 3.0, abs( sub( div( vec3( 1.0, 3.0, 5.0 ), 6.0 ), phase ) ) ) ) ) as GLSLExpression<'vec3'>,
        4.0 / BARREL_ITER
      );
      const barrelAmp = add( BARREL_OFFSET, mul( BARREL_AMP, phase ) );
      addAssign( tex, mul( a, barrel( barrelAmp, uv ) ) );
    } );

    assign( tex, mix( vec3( 0.0 ), tex, vig ) );

    const col = def( 'vec3', tex );
    assign( col, tonemapACESHill( max( col, 0.0 ) ) );
    addAssign( col, mul( 0.002, vec3( sub( random(), 0.5 ) ) ) );
    assign( col, glslSaturate( col ) );
    assign( col, sRGBOETF( col ) );
    assign( col, mix( col, sub( 1.0, col ), mixInvert ) );
    assign( col, liftGammaGain( col, LIFT, GAMMA, GAIN ) );

    assign( fragColor, vec4( col, 1.0 ) );
  } );
} );
