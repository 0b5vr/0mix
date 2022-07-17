import { GLSLExpression, add, assign, cache, def, defFn, defUniformNamed, div, dot, floor, fract, gte, ifThen, min, mix, mul, neg, num, pow, reflect, retFn, sub, sw, texture, vec2 } from '../shaderBuilder';
import { cubemapUV } from './cubemapUV';

const symbolUniforms = Symbol();
const symbolEnvNearest = Symbol();
const symbolEnvLinear = Symbol();
const symbolDoIBL = Symbol();

export function defIBL(): {
  sampleEnvNearest: (
    v: GLSLExpression<'vec3'>,
    lv: GLSLExpression<'float'>,
  ) => GLSLExpression<'vec4'>,
  sampleEnvLinear: (
    v: GLSLExpression<'vec3'>,
    lv: GLSLExpression<'float'>,
  ) => GLSLExpression<'vec4'>,
  diffuseIBL: (
    albedo: GLSLExpression<'vec3'>,
    N: GLSLExpression<'vec3'>,
  ) => GLSLExpression<'vec3'>,
  specularIBL: (
    f0: GLSLExpression<'vec3'>,
    N: GLSLExpression<'vec3'>,
    V: GLSLExpression<'vec3'>,
    roughness: GLSLExpression<'float'>,
  ) => GLSLExpression<'vec3'>,
  } {
  const [
    samplerEnvDry,
    samplerEnvWet,
    samplerIBLLUT,
  ] = cache( symbolUniforms, () => [
    defUniformNamed( 'sampler2D', 'samplerEnvDry' ),
    defUniformNamed( 'sampler2D', 'samplerEnvWet' ),
    defUniformNamed( 'sampler2D', 'samplerIBLLUT' ),
  ] );

  const sampleEnvNearest = cache(
    symbolEnvNearest,
    () => defFn( 'vec4', [ 'vec3', 'float' ], ( v, lv ) => {
      const p = def( 'float', pow( 0.5, lv ) );
      const scale = sub( 1.0, div( 1.0 / 256.0, p ) );

      ifThen( gte( lv, 1.0 ), () => {
        const offset = def( 'vec2', vec2( 0.0, sub( 1.0, mul( 2.0, p ) ) ) );

        assign( p, pow( 0.5, min( lv, 5.0 ) ) );
        const uv = mul( cubemapUV( v, scale ), p );
        retFn( texture( samplerEnvWet, add( uv, offset ) ) );
      }, () => {
        const uv = cubemapUV( v, scale );
        retFn( texture( samplerEnvDry, uv ) );
      } );
    } )
  );

  const sampleEnvLinear = cache(
    symbolEnvLinear,
    () => defFn( 'vec4', [ 'vec3', 'float' ], ( v, lv ) => {
      retFn( mix(
        sampleEnvNearest( v, floor( lv ) ),
        sampleEnvNearest( v, floor( add( lv, 1.0 ) ) ),
        fract( lv ),
      ) );
    } )
  );

  const [
    diffuseIBL,
    specularIBL,
  ] = cache(
    symbolDoIBL,
    () => [
      defFn( 'vec3', [ 'vec3', 'vec3' ], ( albedo, N ) => {
        const texEnvDiffuse = sw( sampleEnvNearest( N, num( 6.0 ) ), 'rgb' );
        retFn( mul( texEnvDiffuse, albedo ) );
      } ),
      defFn( 'vec3', [ 'vec3', 'vec3', 'vec3', 'float' ], ( f0, N, V, roughness ) => {
        const dotNV = dot( N, V );
        const reflEnvReflective = reflect( neg( V ), N );
        const brdfEnvReflective = def( 'vec4', texture( samplerIBLLUT, vec2( dotNV, roughness ) ) );
        const texEnvReflective = sw( sampleEnvLinear( reflEnvReflective, mul( 5.0, roughness ) ), 'rgb' );
        retFn( mul(
          texEnvReflective,
          add(
            mul( sw( brdfEnvReflective, 'x' ), f0 ),
            sw( brdfEnvReflective, 'y' ),
          )
        ) );
      } ),
    ],
  );

  return { sampleEnvNearest, sampleEnvLinear, diffuseIBL, specularIBL };
}
