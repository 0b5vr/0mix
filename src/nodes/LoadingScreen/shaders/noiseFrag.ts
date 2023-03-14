import { abs, add, addAssign, assign, build, def, defInNamed, defOut, glFragCoord, insert, main, mul, pow, smoothstep, sw, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { cyclicNoise } from '../../../shaders/modules/cyclicNoise';
import { pcg3df } from '../../../shaders/modules/pcg3df';

export const noiseFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );
  const fragColor = defOut( 'vec4' );

  main( () => {
    const p = def( 'vec2', vUv );

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
      vec3( mul( 6.0, p ), 0.0 ),
      { warp: 0.9, pump: 1.0 },
    ), 'x' ) ), 6.0 );

    n = add(
      n2,
      n,
      mul( 0.2, sw( pcg3df( sw( glFragCoord, 'xyy' ) ), 'x' ) ),
    );
    n = smoothstep( -0.5, 1.5, n );

    assign( fragColor, vec4( vec3( n ), 1.0 ) );
  } );
} );
