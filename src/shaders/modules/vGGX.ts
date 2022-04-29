import { GLSLExpression, GLSLFloatExpression, add, cache, def, defFn, div, gt, mul, num, retFn, sqrt, sub, tern } from '../shaderBuilder';

const symbol = Symbol();

// The famous "V_SmithGGXCorrelated"
export function vGGX(
  dotNL: GLSLFloatExpression,
  dotNV: GLSLFloatExpression,
  roughnessSq: GLSLFloatExpression,
): GLSLExpression<'float'> {
  const f = cache(
    symbol,
    () => defFn( 'float', [ 'float', 'float', 'float' ], ( dotNL, dotNV, roughnessSq ) => {
      const ggxv = mul(
        dotNL,
        sqrt( add( mul( dotNV, dotNV, sub( 1.0, roughnessSq ) ), roughnessSq ) )
      );
      const ggxl = mul(
        dotNV,
        sqrt( add( mul( dotNL, dotNL, sub( 1.0, roughnessSq ) ), roughnessSq ) )
      );
      const ggx = def( 'float', add( ggxv, ggxl ) );
      retFn( ( tern( gt( ggx, 0.0 ), div( 0.5, ggx ), 0.0 ) ) );
    } )
  );

  return f( num( dotNL ), num( dotNV ), num( roughnessSq ) );
}
