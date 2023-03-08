import { abs, addAssign, assign, build, def, defOut, defUniformNamed, div, glFragCoord, insert, mad, main, mul, mulAssign, pow, sw, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { cyclicNoise } from '../../../shaders/modules/cyclicNoise';

export const noiseFrag = build( () => {
  insert( 'precision highp float;' );

  const fragColor = defOut( 'vec4' );
  const aspect = defUniformNamed( 'float', 'aspect' );
  const resolution = defUniformNamed( 'vec2', 'resolution' );

  main( () => {
    const p = def( 'vec2', div( sw( glFragCoord, 'xy' ), resolution ) );
    assign( p, mad( -1.0, 2.0, p ) );
    mulAssign( sw( p, 'x' ), aspect );

    addAssign( p, mul(
      0.8,
      sw( cyclicNoise(
        vec3( mul( 0.4, p ), 8.0 ),
        { warp: 0.3, pump: 1.2 },
      ), 'xy' ),
    ) );

    let n = sw( cyclicNoise(
      vec3( mul( 3.0, p ), 0.0 ),
      { warp: 0.4 },
    ), 'x' );
    const n2 = pow( abs( sw( cyclicNoise(
      vec3( mul( 8.0, p ), 0.0 ),
      { warp: 0.9, pump: 1.0 },
    ), 'x' ) ), 6.0 );

    n = mad( 0.5, 0.5, n );
    n = mad( n2, 0.7, n );

    assign( fragColor, vec4( vec3( n ), 1.0 ) );
  } );
} );
