import { add, assign, build, def, defInNamed, defOut, defUniformNamed, div, float, floor, forLoop, insert, main, max, min, mod, mul, sub, sw, texture, vec2, vec4 } from '../../../../shaders/shaderBuilder';

export const dofTileGatherFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );
  const fragColor = defOut( 'vec4' );

  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const sampler0 = defUniformNamed( 'sampler2D', 'sampler0' );

  main( () => {
    const depthNearest = def( 'float', 1E9 );
    const cocMax = def( 'float', 0.0 );

    forLoop( 9, ( i ) => {
      const uv = add(
        vUv,
        div(
          sub( vec2( mod( float( i ), 3.0 ), floor( mul( float( i ), 0.34 ) ) ), 1.0 ),
          resolution,
        ),
      );

      const tex = def( 'vec4', texture( sampler0, uv ) );
      assign( depthNearest, min( depthNearest, sw( tex, 'x' ) ) );
      assign( cocMax, max( cocMax, sw( tex, 'y' ) ) );
    } );

    assign( fragColor, vec4( depthNearest, cocMax, 0.0, 0.0 ) );
  } );
} );
