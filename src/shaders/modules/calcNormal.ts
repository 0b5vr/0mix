import { GLSLExpression, GLSLFloatExpression, GLSLToken, Swizzle3ComponentsVec2, add, def, normalize, sub, sw, vec2, vec3 } from '../shaderBuilder';

// Ref: https://www.iquilezles.org/www/articles/normalsSDF/normalsSDF.htm
export function calcNormal( {
  rp,
  map,
  delta,
}: {
  rp: GLSLExpression<'vec3'>,
  map: ( p: GLSLExpression<'vec3'> ) => GLSLExpression<'vec4'>,
  delta?: GLSLFloatExpression,
} ): GLSLToken<'vec3'> {
  const d = vec2( 0.0, delta ?? 1E-4 );

  return def( 'vec3', normalize( vec3(
    ...( [
      'yxx',
      'xyx',
      'xxy',
    ] as Swizzle3ComponentsVec2[] ).map(
      ( s: Swizzle3ComponentsVec2 ): GLSLExpression<'float'> => sw( sub(
        map( add( rp, sw( d, s ) ) ),
        map( sub( rp, sw( d, s ) ) ),
      ), 'x' )
    ) as [ GLSLExpression<'float'>, GLSLExpression<'float'>, GLSLExpression<'float'> ]
  ) ) );
}
