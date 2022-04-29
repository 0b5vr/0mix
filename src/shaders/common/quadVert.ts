import { add, assign, build, defIn, defOutNamed, defUniformNamed, glPosition, main, mix, mul, sw, vec4 } from '../shaderBuilder';

export const quadVert = build( () => {
  const position = defIn( 'vec2', 0 );

  const vUv = defOutNamed( 'vec2', 'vUv' );

  const range = defUniformNamed( 'vec4', 'range' );

  main( () => {
    assign( vUv, add( 0.5, mul( 0.5, position ) ) );
    assign( glPosition, vec4(
      mix( sw( range, 'xy' ), sw( range, 'zw' ), vUv ),
      0.0,
      1.0,
    ) );
  } );
} );
