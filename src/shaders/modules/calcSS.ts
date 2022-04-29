import { GLSLExpression, GLSLFloatExpression, GLSLToken, add, addAssign, def, div, forLoop, max, mul, neg, num, pow, refract, sub, sw } from '../shaderBuilder';
import { glslSaturate } from './glslSaturate';
import { sampleLambert } from './sampleLambert';

// https://www.shadertoy.com/view/lllBDM
export function calcSS( {
  rp,
  V,
  L,
  N,
  map,
  eta,
  iter = 50,
  lenMultiplier = 0.01,
  intensity = 1.0,
  power = 3.0,
}: {
  rp: GLSLExpression<'vec3'>,
  V: GLSLExpression<'vec3'>,
  L: GLSLExpression<'vec3'>,
  N: GLSLExpression<'vec3'>,
  map: ( p: GLSLExpression<'vec3'> ) => GLSLExpression<'vec4'>,
  eta?: GLSLFloatExpression,
  iter?: number,
  lenMultiplier?: GLSLFloatExpression,
  intensity?: GLSLFloatExpression,
  power?: GLSLFloatExpression,
} ): GLSLToken<'float'> {
  const sd = def( 'vec3', refract( neg( V ), N, eta ?? 1.0 / 1.5 ) );
  const len = def( 'float', num( lenMultiplier ) );
  const accum = def( 'float', 0.0 );

  forLoop( iter, () => {
    addAssign( len, lenMultiplier );
    let samplePoint = add( rp, mul( sampleLambert( sd ), len ) );
    samplePoint = add( samplePoint, mul( sampleLambert( L ), len ) );
    const d = sw( map( samplePoint ), 'x' );
    addAssign( accum, div( max( 0.0, neg( d ) ), len ) );
  } );

  const v = glslSaturate( sub( 1.0, mul( intensity, div( accum, iter ) ) ) ) as GLSLExpression<'float'>;
  return def( 'float', pow( v, power ) );
}
