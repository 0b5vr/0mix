import { GLSLExpression, abs, add, addAssign, assign, build, cos, def, defFn, defInNamed, defOutNamed, defUniformNamed, div, float, insert, length, mad, main, max, min, mix, mul, mulAssign, normalize, retFn, sqrt, sub, sw, tan, texture, unrollLoop, vec2, vec3, vec4 } from '../../../../shaders/shaderBuilder';
import { PI } from '../../../../utils/constants';
import { glslDefRandom } from '../../../../shaders/modules/glslDefRandom';
import { glslLinearstep } from '../../../../shaders/modules/glslLinearstep';
import { glslSaturate } from '../../../../shaders/modules/glslSaturate';
import { liftGammaGain } from '../../../../shaders/modules/liftGammaGain';
import { sRGBOETF } from '../../../../shaders/modules/sRGBOETF';
import { tonemapACESHill } from '../../../../shaders/modules/tonemapACESHill';

const BARREL_ITER = 10;
const BARREL_OFFSET = 0.0;
const BARREL_AMP = 0.05;

export const postFrag = build( () => {
  insert( 'precision highp float;' );

  const fragColor = defOutNamed( 'vec4', 'fragColor' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const time = defUniformNamed( 'float', 'time' );
  const colorGrade = defUniformNamed( 'float', 'colorGrade' );
  const cosAmp = defUniformNamed( 'float', 'cosAmp' );
  const aspect = defUniformNamed( 'float', 'aspect' );
  const sampler0 = defUniformNamed( 'sampler2D', 'sampler0' );

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

    const col = def( 'vec3', sw( texture( sampler0, p ), 'xyz' ) );
    assign( col, mix(
      col,
      mad( -0.5, cos( mul( PI, cosAmp, sw( col, 'xxx' ) ) ), 0.5 ),
      glslSaturate( cosAmp ),
    ) );
    retFn( col );
  } );

  main( () => {
    const uv = def( 'vec2', vUv );

    init( vec4( vUv, time, 1.0 ) );

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

    const col = def( 'vec3', tex );
    assign( col, mix( vec3( 0.0 ), col, vig ) );
    assign( col, tonemapACESHill( max( col, 0.0 ) ) );
    addAssign( col, mul( 0.002, vec3( sub( random(), 0.5 ) ) ) );
    assign( col, glslSaturate( col ) );
    assign( col, sRGBOETF( col ) );

    const lift = mix(
      mix(
        vec4( 0.0, 0.0, 0.0, 0.04 ),
        vec4( 0.0, 0.0, 0.0, 0.02 ),
        glslLinearstep( 0.0, 1.0, colorGrade ),
      ),
      mix(
        vec4( 0.01, -0.03, 0.05, -0.02 ),
        vec4( -0.03, 0.01, 0.05, 0.0 ),
        glslLinearstep( 2.0, 3.0, colorGrade ),
      ),
      glslLinearstep( 1.0, 2.0, colorGrade ),
    );
    const gamma = mix(
      mix(
        vec4( 0.0, 0.0, 0.0, -0.1 ),
        vec4( 0.0, 0.0, 0.0, -0.2 ),
        glslLinearstep( 0.0, 1.0, colorGrade ),
      ),
      mix(
        vec4( 0.0, 0.0, -0.02, 0.0 ),
        vec4( -0.02, 0.02, -0.01, 0.0 ),
        glslLinearstep( 2.0, 3.0, colorGrade ),
      ),
      glslLinearstep( 1.0, 2.0, colorGrade ),
    );
    const gain = mix(
      mix(
        vec4( 1.0, 1.01, 1.05, 1.2 ),
        vec4( 1.0, 1.0, 1.1, 1.1 ),
        glslLinearstep( 0.0, 1.0, colorGrade ),
      ),
      mix(
        vec4( 0.86, 1.14, 0.87, 1.06 ),
        vec4( 1.04, 0.98, 1.02, 1.0 ),
        glslLinearstep( 2.0, 3.0, colorGrade ),
      ),
      glslLinearstep( 1.0, 2.0, colorGrade ),
    );
    assign( col, liftGammaGain( col, lift, gamma, gain ) );

    assign( fragColor, vec4( col, 1.0 ) );
  } );
} );
