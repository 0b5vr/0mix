import { GLSLExpression, add, assign, build, def, defOut, defUniformNamed, dot, float, forLoop, glFragCoord, gte, insert, int, ivec2, lt, main, min, mul, or, step, sub, sw, tern, texelFetch, vec4 } from '../../../../shaders/shaderBuilder';

const LUMA = vec4( 0.2126, 0.7152, 0.0722, 0.0 );

export const pixelSorterIndexFrag = ( indexWidth: number ): string => build( () => {
  insert( 'precision highp float;' );

  const fragColor = defOut( 'vec4' );

  const threshold = defUniformNamed( 'float', 'threshold' );
  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const sampler0 = defUniformNamed( 'sampler2D', 'sampler0' );
  const sampler1 = defUniformNamed( 'sampler2D', 'sampler1' );

  const xMax = def( 'int' );

  function getValue( coord: GLSLExpression<'ivec2'> ): GLSLExpression<'vec4'> {
    // distance to the nearest wall, width of its current section, vec2( left, right )
    const isEdge = or( lt( sw( coord, 'x' ), int( 0 ) ), gte( sw( coord, 'x' ), xMax ) );

    // If it's the first round, set 0.0 or 1E4 using threshold
    // If it's following rounds, look up existing left / right
    const v = indexWidth === 1.0
      ? vec4( mul( step( dot(
        texelFetch( sampler0, coord, int( 0 ) ),
        LUMA,
      ), threshold ), 1E4 ) )
      : texelFetch( sampler1, coord, int( 0 ) );

    return tern( isEdge, vec4( 0.0 ), v );
  }

  main( () => {
    assign( xMax, int( sw( resolution, 'x' ) ) );

    const coord = ivec2( sw( glFragCoord, 'xy' ) );
    assign( fragColor, getValue( coord ) );

    forLoop( 15, ( i ) => {
      const offset = mul( add( float( i ), 1 ), indexWidth );

      const coordLeft = sub( coord, ivec2( offset, 0 ) );
      const valueLeft = sw( getValue( coordLeft ), 'x' );
      assign( sw( fragColor, 'x' ), min(
        sw( fragColor, 'x' ),
        add( valueLeft, offset ),
      ) );

      const coordRight = add( coord, ivec2( offset, 0 ) );
      const valueRight = sw( getValue( coordRight ), 'y' );
      assign( sw( fragColor, 'y' ), min(
        sw( fragColor, 'y' ),
        add( valueRight, offset ),
      ) );
    } );
  } );
} );
