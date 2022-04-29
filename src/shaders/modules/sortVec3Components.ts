import { GLSLExpression, GLSLToken, Swizzle2ComponentsVec3, SwizzleComponentVec3, assign, def, lt, sw, tern } from '../shaderBuilder';

export function sortVec3Components( x: GLSLExpression<'vec3'> ): GLSLToken<'vec3'> {
  const v = def( 'vec3', x );

  const compare = ( a: SwizzleComponentVec3, b: SwizzleComponentVec3 ): void => assign(
    sw( v, ( a + b ) as Swizzle2ComponentsVec3 ),
    tern(
      lt( sw( v, a ), sw( v, b ) ),
      sw( v, ( a + b ) as Swizzle2ComponentsVec3 ),
      sw( v, ( b + a ) as Swizzle2ComponentsVec3 )
    ),
  );

  compare( 'x', 'y' );
  compare( 'x', 'z' );
  compare( 'y', 'z' );

  return v;
}
