import { GLSLExpression, GLSLFloatExpression, GLSLToken, abs, add, addAssign, assign, def, defInNamed, discard, forBreak, forLoop, glFrontFacing, gt, ifThen, length, lt, mul, sub, sw, tern } from '../shaderBuilder';

interface RaymarchResult {
  isect: GLSLToken<'vec4'>;
  rl: GLSLToken<'float'>;
  rp: GLSLToken<'vec3'>;
}

export function raymarch( {
  iter,
  ro,
  rd,
  map,
  initRl,
  eps,
  far,
  marchMultiplier,
  discardThreshold,
  beforeMapHook,
  afterMapHook,
}: {
  iter: number,
  ro: GLSLExpression<'vec3'>,
  rd: GLSLExpression<'vec3'>,
  map: ( p: GLSLExpression<'vec3'> ) => GLSLExpression<'vec4'>,
  initRl?: GLSLFloatExpression,
  eps?: GLSLFloatExpression,
  far?: GLSLFloatExpression,

  /**
   * `1.0` by default
   */
  marchMultiplier?: GLSLFloatExpression,

  /**
   * Does not discard if it does not exist.
   * You probably want to give it something like `1E-2`
   */
  discardThreshold?: GLSLFloatExpression,

  /**
   * Executed before the map function on each loop.
   * Intended to be used for grid traversal.
   */
  beforeMapHook?: ( result: RaymarchResult ) => void;

  /**
   * Executed after the map function on each loop.
   */
  afterMapHook?: ( result: RaymarchResult ) => void;
} ): RaymarchResult {
  const vPositionWithoutModel = initRl != null
    ? null
    : defInNamed( 'vec4', 'vPositionWithoutModel' );

  const isect = def( 'vec4' );
  const fallbackInitRl = tern(
    glFrontFacing,
    length( sub( sw( vPositionWithoutModel!, 'xyz' ), ro ) ),
    0.0,
  );
  const rl = def(
    'float',
    initRl ?? fallbackInitRl,
  );
  const rp = def( 'vec3', add( ro, mul( rd, rl ) ) );

  forLoop( iter, () => {
    beforeMapHook?.( { isect, rl, rp } );
    assign( isect, map( rp ) );
    afterMapHook?.( { isect, rl, rp } );

    const dist = sw( isect, 'x' );
    addAssign( rl, mul( dist, marchMultiplier ?? 1.0 ) );
    assign( rp, add( ro, mul( rd, rl ) ) );

    ifThen( lt( abs( dist ), eps ?? 1E-3 ), () => forBreak() );
    if ( far != null ) {
      ifThen( gt( rl, far ), () => forBreak() );
    }
  } );

  if ( discardThreshold ) {
    ifThen( gt( sw( isect, 'x' ), discardThreshold ), () => discard() );
  }

  return { isect, rl, rp };
}
