import { add, addAssign, assign, build, def, defOut, defUniformNamed, div, dot, eq, floor, glFragCoord, ifThen, insert, int, ivec2, lt, main, mix, mod, mul, neg, retFn, step, sub, subAssign, sw, texelFetch, vec2, vec4 } from '../../../../shaders/shaderBuilder';

const LUMA = vec4( 0.2126, 0.7152, 0.0722, 0.0 );

export const ALIGN_SIZE = 256;

export const pixelSorterFrag = build( () => {
  insert( 'precision highp float;' );

  const fragColor = defOut( 'vec4' );

  const comp = defUniformNamed( 'float', 'comp' );
  const dir = defUniformNamed( 'float', 'dir' );
  const sampler0 = defUniformNamed( 'sampler2D', 'sampler0' );
  const sampler1 = defUniformNamed( 'sampler2D', 'sampler1' );

  main( () => {
    const coord = ivec2( sw( glFragCoord, 'xy' ) );
    const texIndex = def( 'vec4', texelFetch( sampler1, coord, int( 0 ) ) );
    const tex = texelFetch( sampler0, coord, int( 0 ) );

    assign( fragColor, tex );

    ifThen( eq( sw( texIndex, 'x' ), 0.0 ), () => retFn() );

    const index = sw( texIndex, 'x' );
    const width = add( index, sw( texIndex, 'y' ), -1.0 );

    ifThen( lt( width, div( ALIGN_SIZE, comp ) ), () => retFn() );

    const segOrigin = def( 'vec2', vec2( coord ) );
    subAssign( sw( segOrigin, 'x' ), sub( index, 1.0 ) );

    const alignedIndex = def( 'float', floor( div( index, add( 1.0, width ), 1.0 / ALIGN_SIZE ) ) );
    const alignDelta = def( 'float', div( width, ALIGN_SIZE ) );

    const isRight = def( 'float', step(
      1.0,
      mod( div( alignedIndex, comp ), 2.0 ),
    ) );

    const compDelta = mul( comp, alignDelta );
    const coordA = def( 'vec2', segOrigin );
    addAssign( sw( coordA, 'x' ), mul( alignDelta, add( alignedIndex, 0.5 ) ) );
    const coordB = def( 'vec2', coordA );
    addAssign( sw( coordB, 'x' ), mix( compDelta, neg( compDelta ), isRight ) );

    const texA = texelFetch( sampler0, ivec2( coordA ), int( 0 ) );
    const texB = texelFetch( sampler0, ivec2( coordB ), int( 0 ) );

    const valueA = dot( texA, LUMA );
    const valueB = dot( texB, LUMA );

    const shouldRightBeSmaller = step(
      1.0,
      mod( div( alignedIndex, dir ), 2.0 ),
    );

    // should we swap the pixel?
    const shouldSwap = mod( add(
      shouldRightBeSmaller,
      isRight,
      step( valueB, valueA ),
    ), 2.0 );

    assign( fragColor, mix( tex, texB, shouldSwap ) );
  } );
} );
