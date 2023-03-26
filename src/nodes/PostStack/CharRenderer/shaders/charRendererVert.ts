import { GLSLExpression, add, assign, build, defIn, defOutNamed, defUniformNamed, div, floor, glPosition, mad, main, mix, mul, step, sw, vec2, vec4 } from '../../../../shaders/shaderBuilder';

export const charRendererVert = (
  anchor: GLSLExpression<'vec2'>,
  offset: GLSLExpression<'vec2'>,
): string => build( () => {
  const position = defIn( 'vec2', 0 );
  const meta = defIn( 'vec4', 1 );

  const vCoord = defOutNamed( 'vec2', 'vCoord' );
  const vMeta = defOutNamed( 'vec4', 'vMeta' );

  const scroll = defUniformNamed( 'float', 'scroll' );
  const resolution = defUniformNamed( 'vec2', 'resolution' );

  main( () => {
    assign( vCoord, div( mix(
      vec2( 0.0, -1.0 ),
      vec2( 6.0, 6.0 ),
      mad( 0.5, position, 0.5 ),
    ), 5.0 ) );
    assign( vMeta, meta );

    const scale = floor( div( sw( resolution, 'y' ), 360.0 ) );
    const pos = add(
      div(
        floor( add(
          mul(
            vec2( 6.0, -7.0 ),
            add(
              sw( meta, 'xy' ),
              mul( vec2( 0.5, 0.5 ), position ),
              mul( -1.0, vec2( 0.0, scroll ) ),
              offset,
            ),
            scale,
          ),
        ) ),
        resolution,
        0.5,
      ),
      anchor,
    );

    // shrink if char index is 0
    const posShrinkIf0 = mul( pos, step( 1.0, sw( vMeta, 'z' ) ) );

    assign( glPosition, vec4( posShrinkIf0, 0.0, 1.0 ) );
  } );
} );
