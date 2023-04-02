import { HALF_PI, TAU } from '../../../../utils/constants';
import { abs, add, assign, atan, build, def, defInNamed, defOutNamed, defUniformNamed, div, dot, glFragCoord, insert, length, main, max, mix, mixStepChain, mod, mul, sin, step, sub, sw, vec2, vec3, vec4 } from '../../../../shaders/shaderBuilder';
import { glslLinearstep } from '../../../../shaders/modules/glslLinearstep';
import { glslLofi } from '../../../../shaders/modules/glslLofi';
import { pcg3df } from '../../../../shaders/modules/pcg3df';

export const fuiShitFrag = build( () => {
  insert( 'precision highp float;' );

  const vCoord = defInNamed( 'vec2', 'vCoord' );
  const vDice = defInNamed( 'vec3', 'vDice' );
  const vMode = defInNamed( 'float', 'vMode' );

  const fragColor = defOutNamed( 'vec4', 'fragColor' );

  const time = defUniformNamed( 'float', 'time' );
  const resolution = defUniformNamed( 'vec2', 'resolution' );

  main( () => {
    const diceZ = sw( vDice, 'z' );
    const deltaPixel = def( 'float', div( 2.0, sw( resolution, 'y' ) ) );
    const t = def( 'float', add( time, sw( vDice, 'z' ) ) );

    const shape = mixStepChain(
      vMode,
      1.0,

      // a plus
      [ 1.0, max(
        step( abs( sw( vCoord, 'x' ) ), 0.2 ),
        step( abs( sw( vCoord, 'y' ) ), 0.2 ),
      ) ],

      // a box
      [ 2.0, max(
        mul(
          max(
            step( 0.93, abs( sw( vCoord, 'x' ) ) ),
            step( 0.93, abs( sw( vCoord, 'y' ) ) ),
          ),
          step( 0.5, abs( sw( vCoord, 'x' ) ) ),
          step( 0.5, abs( sw( vCoord, 'y' ) ) ),
        ),
        mul(
          step( abs( sw( vCoord, 'x' ) ), 0.1 ),
          step( abs( sw( vCoord, 'y' ) ), 0.1 ),
        ),
      ) ],

      // a huge x
      [ 3.0, max(
        step(
          abs( dot( vCoord, vec2( 1.0, 1.0 ) ) ),
          div( deltaPixel, 2.0, mul( 0.5, diceZ, diceZ ) ),
        ),
        step(
          abs( dot( vCoord, vec2( 1.0, -1.0 ) ) ),
          div( deltaPixel, 2.0, mul( 0.5, diceZ, diceZ ) ),
        ),
      ) ],

      // a bar
      [ 4.0, mul(
        step( 0.05, abs( sub( sw( vCoord, 'y' ), 0.8 ) ) ),
        step( sub( diceZ, 0.6 ), sw( vCoord, 'y' ) ),
      ) ],

      // a spinner
      [ 5.0, mul(
        glslLinearstep(
          div( deltaPixel, 0.03, 2.0 ),
          div( deltaPixel, -0.03, 2.0 ),
          sub( abs( sub( length( vCoord ), 0.75 ) ), 0.2 ),
        ),
        step( HALF_PI, mod( add(
          atan( sw( vCoord, 'y' ), sw( vCoord, 'x' ) ),
          glslLofi( mul( 16.0, t ), HALF_PI ),
        ), TAU ) ),
      ) ],

      // a huge circle
      [ 6.0, glslLinearstep(
        div( deltaPixel, mul( 0.5, diceZ, diceZ ) ),
        0.0,
        abs( sub( length( vCoord ), 0.95 ) ),
      ) ],

      // a crosshair
      [ 7.0, mul(
        max(
          step( abs( dot( vCoord, vec2( 1.0, 1.0 ) ) ), mul( 5.0, deltaPixel ) ),
          step( abs( dot( vCoord, vec2( 1.0, -1.0 ) ) ), mul( 5.0, deltaPixel ) ),
        ),
        step( 0.5, abs( sw( vCoord, 'x' ) ) ),
        step( 0.5, abs( sw( vCoord, 'y' ) ) ),
      ) ],

      // a grid
      [ 8.0, mul(
        step( abs( sub( mod( sw( vCoord, 'x' ), 0.5 ), 0.25 ) ), 0.08 ),
        step( abs( sub( mod( sw( vCoord, 'y' ), 0.5 ), 0.25 ) ), 0.08 ),
      ) ],

      // a selection
      [ 9.0, mul(
        max(
          step(
            sub( 1.0, div( deltaPixel, mix( 0.1, 0.5, diceZ ) ) ),
            abs( sw( vCoord, 'x' ) ),
          ),
          step(
            sub( 1.0, div( deltaPixel, mix( 0.5, 0.1, diceZ ) ) ),
            abs( sw( vCoord, 'y' ) ),
          ),
        ),
        step( 0.0, sin( add(
          mul( 0.1 * TAU, dot( sw( glFragCoord, 'xy' ), vec2( 1.0 ) ) ),
          mul( 10.0, t ),
        ) ) ),
      ) ],

      // barcode
      [ 10.0, mul(
        step( 0.5, sw( pcg3df(
          vec3( diceZ, glslLofi( sw( vCoord, 'x' ), 0.1 ), glslLofi( t, 0.05 ) )
        ), 'x' ) ),
      ) ],

      // a crosshair 2
      [ 11.0, mul(
        step(
          0.8,
          abs( dot( vCoord, vec2( 1.0, 1.0 ) ) ),
        ),
        step(
          0.8,
          abs( dot( vCoord, vec2( 1.0, -1.0 ) ) ),
        ),
      ) ],
    );

    assign( fragColor, vec4( vec3( shape ), shape ) );
  } );
} );
