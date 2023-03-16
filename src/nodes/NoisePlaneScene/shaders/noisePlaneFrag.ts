import { addAssign, assign, build, def, defInNamed, defOutNamed, defUniformNamed, insert, mad, main, mul, mulAssign, normalize, pow, sw, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { cyclicNoise } from '../../../shaders/modules/cyclicNoise';

export const noisePlaneFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOutNamed( 'vec4', 'fragColor' );

  const time = defUniformNamed( 'float', 'time' );
  const aspect = defUniformNamed( 'float', 'aspect' );

  main( () => {
    const p = def( 'vec2', mad( 2.0, vUv, -1.0 ) );
    mulAssign( sw( p, 'x' ), aspect );

    const pt = def( 'vec3', mul( 2.0, normalize( vec3( p, 0.3 ) ) ) );
    addAssign( sw( pt, 'z' ), time );
    addAssign( pt, mul( 0.5, cyclicNoise( pt ) ) );

    const haha = def(
      'float',
      mad( 0.5, sw( cyclicNoise( pt ), 'x' ), 0.5 ),
    );

    assign( fragColor, vec4( vec3( pow( haha, 4.0 ) ), 1.0 ) );
  } );
} );
