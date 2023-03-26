import { abs, add, assign, build, def, defInNamed, defOutNamed, defUniformNamed, insert, mad, main, mix, mul, mulAssign, step, sw, vec3, vec4 } from '../../../shaders/shaderBuilder';

export const obsvrLogoBFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOutNamed( 'vec4', 'fragColor' );

  const aspect = defUniformNamed( 'float', 'aspect' );

  main( () => {
    const p = def( 'vec2', mad( 2.0, vUv, -1.0 ) );
    mulAssign( sw( p, 'x' ), aspect );
    mulAssign( p, 4.0 );

    assign( p, abs( p ) );
    assign( p, mix( p, sw( p, 'yx' ), step( sw( p, 'x' ), sw( p, 'y' ) ) ) );

    const shape = add(
      step( sw( p, 'x' ), 0.1 ),
      mul(
        step( 0.3, sw( p, 'x' ) ),
        step( sw( p, 'x' ), 0.5 ),
        step( sw( p, 'y' ), 0.3 ),
      ),
    );

    assign( fragColor, vec4( vec3( shape ), 1.0 ) );
  } );
} );
