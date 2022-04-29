import { GLSLExpression, abs, assign, cache, cross, def, defFn, mat3, normalize, retFn, sq, sub, sw, vec3 } from '../shaderBuilder';

const symbol = Symbol();

export function orthBas( z: GLSLExpression<'vec3'> ): GLSLExpression<'mat3'> {
  const f = cache( symbol, () => defFn( 'mat3', [ 'vec3' ], ( z ) => {
    assign( z, normalize( z ) );
    const zy = sw( z, 'y' );
    const up = vec3( 0.0, sub( 1.0, sq( zy ) ), abs( zy ) );
    // const up = tern( gt( abs( sw( z, 'y' ) ), 0.999 ), vec3( 0, 0, 1 ), vec3( 0, 1, 0 ) );
    const x = def( 'vec3', normalize( cross( up, z ) ) );
    retFn( mat3( x, cross( z, x ), z ) );
  } ) );

  return f( z );
}
