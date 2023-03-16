import { SQRT3 } from '../../../../utils/constants';
import { add, assign, build, def, defFn, defInNamed, defOut, defUniformNamed, div, divAssign, dot, ifChain, insert, lt, mad, main, mod, mul, mulAssign, retFn, step, sub, sw, texture, vec2 } from '../../../../shaders/shaderBuilder';

export const kaleidoscopeFrag: string = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  const mode = defUniformNamed( 'float', 'mode' );
  const aspect = defUniformNamed( 'float', 'aspect' );
  const sampler0 = defUniformNamed( 'sampler2D', 'sampler0' );

  const fart = defFn( 'vec2', [ 'vec2', 'vec2' ], ( p, v ) => {
    const d = dot( p, v );
    const df = mod( d, 2.0 );
    const di = sub( d, df );
    retFn( sub(
      p,
      mul( add( di, mul( 2.0, sub( df, 1.0 ), step( 1.0, df ) ) ), div( v, dot( v, v ) ) )
    ) );
  } );

  main( () => {
    const p = def( 'vec2', mad( 2.0, vUv, -1.0 ) );
    mulAssign( sw( p, 'x' ), aspect );

    ifChain(
      [ lt( mode, 1.5 ), () => {
        assign( p, fart( p, vec2( 0.1, 0.0 ) ) );
      } ],
      [ lt( mode, 2.5 ), () => {
        assign( p, fart( p, vec2( 0.1, 0.0 ) ) );
        assign( p, fart( p, vec2( 0.0, 0.1 ) ) );
      } ],
      [ lt( mode, 3.5 ), () => {
        assign( p, fart( p, vec2( 2.0, 0.0 ) ) );
        assign( p, fart( p, vec2( -1.0, -SQRT3 ) ) );
        assign( p, fart( p, vec2( -1.0, SQRT3 ) ) );
      } ],
    );

    divAssign( sw( p, 'x' ), aspect );

    assign( fragColor, texture( sampler0, mad( 0.5, p, 0.5 ) ) );
  } );
} );
