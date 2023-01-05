import { GLSLExpression, add, assign, build, defIn, defOutNamed, defUniformNamed, div, glPosition, main, mul, step, sw, vec2, vec4 } from '../../../../shaders/shaderBuilder';

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
    assign( vCoord, position );
    assign( vMeta, meta );

    const pos = add(
      div(
        add(
          mul( vec2( 6.0, 7.0 ), position ),
          mul( vec2( 12.0, -14.0 ), sw( meta, 'xy' ) ),
          offset,
          vec2( 0.0, mul( scroll, 14.0 ) ),
        ),
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
