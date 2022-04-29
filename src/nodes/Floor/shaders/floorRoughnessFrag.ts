import { addAssign, assign, build, def, defInNamed, defOut, insert, main, mix, mul, mulAssign, smoothstep, sw, unrollLoop, vec2, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { cyclicNoise } from '../../../shaders/modules/cyclicNoise';
import { simplex2d } from '../../../shaders/modules/simplex2d';

export const floorRoughnessFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  main( () => {
    const noiseDisplacer = cyclicNoise( vec3( mul( vUv, vec2( 10.0, 10.0 ) ), 1.0 ), {
      pump: 1.4,
      freq: 2.0,
      warp: 0.1,
    } );
    const noiseA = def( 'float', (
      sw( cyclicNoise( vec3( mul( noiseDisplacer, 20.0 ) ), {
        pump: 2.0,
        freq: 2.0,
        warp: 0.5,
      } ), 'x' )
    ) );

    const simplex = simplex2d( mul( 50.0, vUv ) );
    const scratch = simplex2d( vec2( mul( 20.0, simplex ) ) );
    mulAssign( noiseA, smoothstep( -0.7, 0.0, scratch ) );
    assign( noiseA, smoothstep( -0.2, 1.0, noiseA ) );

    const noiseB = def( 'float', 0.0 );
    const noiseBFreq = def( 'float', 50.0 );
    unrollLoop( 4, () => {
      const n = simplex2d( mul( noiseBFreq, vUv ) );
      addAssign( noiseB, mul( n, 0.25 ) );
      mulAssign( noiseBFreq, 2.0 );
    } );

    const noise = mix( noiseA, noiseB, 0.5 );
    assign( fragColor, vec4( noise, 0.0, 0.0, 1.0 ) );
  } );
} );
