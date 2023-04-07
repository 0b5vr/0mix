import { addAssign, assign, build, def, defInNamed, defOut, insert, main, mul, unrollLoop, vec2, vec4 } from '../../shaders/shaderBuilder';
import { perlin2d } from '../../shaders/modules/perlin2d';

export const perlinFBMFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  main( () => {
    const sum = def( 'vec4', vec4( 0.5 ) );

    unrollLoop( 4, ( i ) => {
      const h = Math.pow( 2.0, i );
      addAssign( sum, mul(
        vec4(
          perlin2d( mul( 1.0 * h, vUv ), vec2( 1.0 * h ) ),
          perlin2d( mul( 4.0 * h, vUv ), vec2( 4.0 * h ) ),
          perlin2d( mul( 16.0 * h, vUv ), vec2( 16.0 * h ) ),
          perlin2d( mul( 64.0 * h, vUv ), vec2( 64.0 * h ) ),
        ),
        0.5 / h,
      ) );
    } );

    assign( fragColor, sum );
  } );
} );
