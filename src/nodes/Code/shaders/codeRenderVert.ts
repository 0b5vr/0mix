import { add, assign, build, defIn, defOutNamed, defUniformNamed, div, glPosition, main, mul, step, sub, sw, vec2, vec4 } from '../../../shaders/shaderBuilder';

export const codeRenderVert = build( () => {
  const position = defIn( 'vec2', 0 );
  const meta = defIn( 'vec4', 1 );

  const vCoord = defOutNamed( 'vec2', 'vCoord' );
  const vMeta = defOutNamed( 'vec4', 'vMeta' );

  const resolution = defUniformNamed( 'vec2', 'resolution' );

  main( () => {
    assign( vCoord, position );
    assign( vMeta, meta );

    const pos = sub(
      div(
        add(
          mul( 7.0, position ),
          mul( vec2( 12.0, -14.0 ), sw( meta, 'xy' ) ),
          vec2( 128.0, 0.0 )
        ),
        resolution,
        0.5,
      ),
      vec2( 1.0, 0.0 ),
    );

    // shrink if char index is 0
    const posShrinkIf0 = mul( pos, step( 1.0, sw( vMeta, 'z' ) ) );

    assign( glPosition, vec4( posShrinkIf0, 0.0, 1.0 ) );
  } );
} );
