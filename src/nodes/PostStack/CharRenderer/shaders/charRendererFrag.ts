import { abs, add, assign, build, def, defInNamed, defOutNamed, defUniformNamed, div, floor, insert, main, mix, mixStepChain, mul, mulAssign, step, sub, sw, tern, texture, vec2, vec3, vec4 } from '../../../../shaders/shaderBuilder';
import { isValidUv } from '../../../../shaders/modules/isValidUv';

export const charRendererFrag = build( () => {
  insert( 'precision highp float;' );

  const vCoord = defInNamed( 'vec2', 'vCoord' );
  const vMeta = defInNamed( 'vec4', 'vMeta' );

  const fragColor = defOutNamed( 'vec4', 'fragColor' );

  const samplerChar = defUniformNamed( 'sampler2D', 'samplerChar' );

  main( () => {
    const uv = mul(
      add(
        vCoord,
        floor( div( sw( vMeta, 'z' ), vec2( 1.0, 16.0 ) ) ),
      ),
      1.0 / 16.0,
    );

    const tex = def( 'float', sw( texture( samplerChar, uv ), 'x' ) );
    mulAssign( tex, tern( isValidUv( vCoord ), 1.0, 0.0 ) );

    const color = mixStepChain(
      abs( sw( vMeta, 'w' ) ),
      vec3( 1.0 ),
      [ 2.0, vec3( 0.4, 0.5, 0.6 ) ],
      [ 3.0, vec3( 1.0, 0.5, 0.6 ) ],
      [ 4.0, vec3( 0.7, 0.7, 1.0 ) ],
      [ 5.0, vec3( 0.5, 0.9, 1.0 ) ],
      [ 6.0, vec3( 1.0 ) ],
    );

    assign( tex, mix(
      tex,
      sub( 1.0, tex ),
      step( sw( vMeta, 'w' ), 0.5 ),
    ) );

    assign( fragColor, vec4( vec3( mul( color, tex ) ), mix( 0.9, 1.0, tex ) ) );
  } );
} );
