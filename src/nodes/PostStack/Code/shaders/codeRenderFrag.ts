import { glslLinearstep } from '../../../../shaders/modules/glslLinearstep';
import { isValidUv } from '../../../../shaders/modules/isValidUv';
import { add, assign, build, def, defInNamed, defOutNamed, defUniformNamed, div, exp, floor, insert, main, mix, mul, mulAssign, sub, sw, tern, texture, vec2, vec3, vec4 } from '../../../../shaders/shaderBuilder';

export const codeRenderFrag = build( () => {
  insert( 'precision highp float;' );

  const vCoord = defInNamed( 'vec2', 'vCoord' );
  const vMeta = defInNamed( 'vec4', 'vMeta' );

  const fragColor = defOutNamed( 'vec4', 'fragColor' );

  const time = defUniformNamed( 'float', 'time' );
  const samplerChar = defUniformNamed( 'sampler2D', 'samplerChar' );

  main( () => {
    const uvm = add( 0.5, mul( vec2( 3.5 / 5.0, -3.5 / 5.0 ), vCoord ) );
    const uv = mul(
      add(
        uvm,
        floor( div( sw( vMeta, 'z' ), vec2( 1.0, 16.0 ) ) ),
      ),
      1.0 / 16.0,
    );

    const tex = def( 'float', sw( texture( samplerChar, uv ), 'x' ) );
    mulAssign( tex, tern( isValidUv( uvm ), 1.0, 0.0 ) );

    const ani = exp( mul( 10.0, sub( sw( vMeta, 'w' ), time ) ) );
    assign( tex, mix(
      sub( 1.0, tex ),
      tex,
      glslLinearstep( sub( ani, 0.125 ), ani, mul( 0.5, add( 1.0, sw( vCoord, 'y' ) ) ) ),
    ) );

    assign( fragColor, vec4( vec3( tex ), mix( 0.9, 1.0, tex ) ) );
  } );
} );
