import { add, assign, build, defIn, defOutNamed, defUniformNamed, div, floor, glPosition, mad, main, mix, mixStepChain, mul, sub, sw, vec2, vec3, vec4 } from '../../../../shaders/shaderBuilder';
import { pcg3df } from '../../../../shaders/modules/pcg3df';

export const fuiShitVert = build( () => {
  const position = defIn( 'vec2', 0 );
  const index = defIn( 'float', 1 );

  const vCoord = defOutNamed( 'vec2', 'vCoord' );
  const vDice = defOutNamed( 'vec3', 'vDice' );
  const vMode = defOutNamed( 'float', 'vMode' );

  const time = defUniformNamed( 'float', 'time' );
  const aspect = defUniformNamed( 'float', 'aspect' );
  const resolution = defUniformNamed( 'vec2', 'resolution' );

  main( () => {
    assign( vCoord, position );

    assign( vDice, pcg3df( vec3(
      index,
      floor( mad( time, 0.17, index ) ),
      0.0,
    ) ) );
    const diceZ = sw( vDice, 'z' );

    assign( vMode, mul( 12.0, sw( pcg3df( vDice ), 'x' ) ) );
    const size = mixStepChain(
      vMode,
      mix( vec2( 0.005, 0.02 ), vec2( 0.02, 0.005 ), diceZ ),
      [ 1.0, vec2( 0.02 ) ],
      [ 2.0, vec2( 0.05 ) ],
      [ 3.0, vec2( mul( 0.5, diceZ, diceZ ) ) ],
      [ 4.0, vec2( 0.01, 0.1 ) ],
      [ 5.0, vec2( 0.03 ) ],
      [ 6.0, vec2( mul( 0.5, diceZ, diceZ ) ) ],
      [ 7.0, vec2( 0.1 ) ],
      [ 8.0, vec2( 0.05 ) ],
      [ 9.0, vec2( mix( vec2( 0.1, 0.5 ), vec2( 0.5, 0.1 ), diceZ ) ) ],
      [ 10.0, vec2( 0.05, 0.01 ) ],
      [ 11.0, vec2( 0.05 ) ],
    );

    const pos = add(
      div( mul( size, position ), vec2( aspect, 1.0 ) ),
      sub( div( floor( mul( resolution, 0.4, sw( vDice, 'xy' ) ) ), 0.25, resolution ), 0.8 ),
    );

    assign( glPosition, vec4( pos, 0.0, 1.0 ) );
  } );
} );

