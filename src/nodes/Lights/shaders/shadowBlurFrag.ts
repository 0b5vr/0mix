import { add, addAssign, assign, build, def, defInNamed, defOutNamed, defUniformNamed, div, insert, main, mul, sub, sw, texture, vec2, vec4 } from '../../../shaders/shaderBuilder';

export const shadowBlurFrag = ( isVert: boolean ): string => build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOutNamed( 'vec4', 'fragColor' );

  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const sampler0 = defUniformNamed( 'sampler2D', 'sampler0' );

  main( () => {
    const deltaTexel = div( 1.0, resolution );

    const bv = mul( deltaTexel, isVert ? vec2( 0.0, 1.0 ) : vec2( 1.0, 0.0 ) );
    const sum = def( 'vec4', vec4( 0.0 ) );

    const tex = texture( sampler0, vUv );

    addAssign( sum, mul( 0.29411764705882354, tex ) );
    let uvt = sub( vUv, mul( bv, 1.3333333333333333 ) );
    addAssign( sum, mul( 0.35294117647058826, texture( sampler0, uvt ) ) );
    uvt = add( vUv, mul( bv, 1.3333333333333333 ) );
    addAssign( sum, mul( 0.35294117647058826, texture( sampler0, uvt ) ) );

    assign( fragColor, vec4( sw( sum, 'xy' ), sw( tex, 'z' ), 1.0 ) );
  } );
} );
