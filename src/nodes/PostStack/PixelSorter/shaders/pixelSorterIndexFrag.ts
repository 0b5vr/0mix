import { GLSLExpression, add, assign, build, defInNamed, defOut, defUniformNamed, div, dot, float, forLoop, insert, main, min, mix, mul, step, sub, sw, texture, vec2, vec4 } from '../../../../shaders/shaderBuilder';

const LUMA = vec4( 0.2126, 0.7152, 0.0722, 0.0 );

export const pixelSorterIndexFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );
  const fragColor = defOut( 'vec4' );

  const threshold = defUniformNamed( 'float', 'threshold' );
  const indexWidth = defUniformNamed( 'float', 'indexWidth' );
  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const sampler0 = defUniformNamed( 'sampler2D', 'sampler0' );
  const sampler1 = defUniformNamed( 'sampler2D', 'sampler1' );

  function getValue( uv: GLSLExpression<'vec2'> ): GLSLExpression<'vec4'> {
    // distance to the nearest wall, width of its current section, vec2( left, right )
    const isEdge = add( step( sw( uv, 'x' ), 0.0 ), step( 1.0, sw( uv, 'x' ) ) );

    return mix(
      mix(
        texture( sampler1, uv ),
        vec4(
          vec2( mul( step( dot( texture( sampler0, uv ), LUMA ), threshold ), 1E4 ) ),
          0.0,
          0.0,
        ),
        step( indexWidth, 1.0 ),
      ),
      vec4( 0.0 ),
      isEdge,
    );
  }

  main( () => {
    assign( fragColor, getValue( vUv ) );

    forLoop( 7, ( i ) => {
      const offset = mul( add( float( i ), 1 ), indexWidth );
      const uvOffset = div( vec2( offset, 0 ), resolution );

      const uvtLeft = sub( vUv, uvOffset );
      assign( sw( fragColor, 'x' ), min(
        sw( fragColor, 'x' ),
        add( sw( getValue( uvtLeft ), 'x' ), offset ),
      ) );

      const uvtRight = add( vUv, uvOffset );
      assign( sw( fragColor, 'y' ), min(
        sw( fragColor, 'y' ),
        add( sw( getValue( uvtRight ), 'y' ), offset ),
      ) );
    } );
  } );
} );
