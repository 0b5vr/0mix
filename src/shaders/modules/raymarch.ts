import { GLSLExpression, GLSLFloatExpression, GLSLToken, abs, add, addAssign, assign, def, defInNamed, forBreak, forLoop, gt, ifThen, length, lt, mul, sub, sw } from '../shaderBuilder';

export function raymarch( {
  iter,
  ro,
  rd,
  map,
  initRl,
  eps,
  far,
  marchMultiplier,
}: {
  iter: number,
  ro: GLSLExpression<'vec3'>,
  rd: GLSLExpression<'vec3'>,
  map: ( p: GLSLExpression<'vec3'> ) => GLSLExpression<'vec4'>,
  initRl?: GLSLFloatExpression,
  eps?: GLSLFloatExpression,
  far?: GLSLFloatExpression,
  marchMultiplier?: GLSLFloatExpression,
} ): {
    isect: GLSLToken<'vec4'>,
    rl: GLSLToken<'float'>,
    rp: GLSLToken<'vec3'>,
  } {
  const vPositionWithoutModel = defInNamed( 'vec4', 'vPositionWithoutModel' );

  const isect = def( 'vec4' );
  const rl = def(
    'float',
    initRl ?? length( sub( sw( vPositionWithoutModel, 'xyz' ), ro ) ),
  );
  const rp = def( 'vec3', add( ro, mul( rd, rl ) ) );

  forLoop( iter, () => {
    assign( isect, map( rp ) );
    const dist = sw( isect, 'x' );
    addAssign( rl, mul( dist, marchMultiplier ?? 1.0 ) );
    assign( rp, add( ro, mul( rd, rl ) ) );

    ifThen( lt( abs( dist ), eps ?? 1E-3 ), () => forBreak() );
    if ( far != null ) {
      ifThen( gt( rl, far ), () => forBreak() );
    }
  } );

  return { isect, rl, rp };
}
