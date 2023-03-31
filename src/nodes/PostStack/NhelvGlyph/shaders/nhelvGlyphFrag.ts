import { abs, addAssign, assign, build, def, defInNamed, defOutNamed, defUniformNamed, discard, divAssign, eq, exp, floor, fract, gt, ifThen, insert, lt, mad, main, mix, mul, mulAssign, smoothstep, step, sub, subAssign, sw, ternChain, vec2, vec3, vec4 } from '../../../../shaders/shaderBuilder';
import { pcg3df } from '../../../../shaders/modules/pcg3df';

export const nhelvGlyphFrag = build( () => {
  insert( 'precision highp float;' );

  const fragColor = defOutNamed( 'vec4', 'fragColor' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const aspect = defUniformNamed( 'float', 'aspect' );
  const alpha = defUniformNamed( 'float', 'alpha' );
  const seed = defUniformNamed( 'float', 'seed' );

  main( () => {
    const p = def( 'vec2', mad( 2.0, vUv, -1.0 ) );
    mulAssign( sw( p, 'x' ), aspect );

    const ani = def( 'float', exp( mul( -2.0, fract( seed ) ) ) );

    divAssign( p, mix( 0.3, 0.29, ani ) );
    subAssign( p, 0.1 );

    const pt = def( 'vec2', abs( sub( fract( mul( 20.0, p ) ), 0.5 ) ) );
    const matrix = def( 'float', mul(
      smoothstep( 0.6, 0.1, sw( pt, 'x' ) ),
      smoothstep( 0.6, 0.3, sw( pt, 'y' ) ),
    ) );

    const cell = def( 'vec2', floor( p ) );
    addAssign( cell, mul( 0.5, step( 0.8, sub( p, cell ) ) ) );
    const coord = def( 'vec2', fract( cell ) );

    const thr = ternChain(
      0.5,
      [ lt( sw( cell, 'x' ), -3.0 ), 0.0 ],
      [ gt( sw( cell, 'x' ), 2.0 ), 0.0 ],
      [ lt( sw( cell, 'y' ), -2.0 ), 0.0 ],
      [ gt( sw( cell, 'y' ), 1.0 ), 0.0 ],
      [ eq( coord, vec2( 0.5 ) ), 0.0 ],
      [ eq( coord, vec2( 0.0 ) ), 1.0 ],
    );

    const dice = sw( pcg3df( vec3( cell, floor( seed ) ) ), 'x' );

    ifThen( lt( thr, dice ), () => discard() );

    assign( fragColor, vec4( mul( matrix, alpha, ani ) ) );
  } );
} );
