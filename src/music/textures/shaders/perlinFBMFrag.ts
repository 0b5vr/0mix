import { addAssign, assign, build, def, defInNamed, defOut, insert, main, mul, unrollLoop, vec2, vec4 } from '../../../shaders/shaderBuilder';
import { perlin2d } from '../../../shaders/modules/perlin2d';

export const perlinFBMFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  main( () => {
    const sum = def( 'float', 0.5 );

    unrollLoop( 4, ( i ) => {
      const h = Math.pow( 2.0, i );
      addAssign( sum, mul( perlin2d( mul( 8.0 * h, vUv ), vec2( 8.0 * h ) ), 0.5 / h ) );
    } );

    assign( fragColor, vec4( sum, 0.0, 0.0, 1.0 ) );
  } );
} );
