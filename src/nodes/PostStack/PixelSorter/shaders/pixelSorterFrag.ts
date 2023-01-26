import { add, assign, build, def, defInNamed, defOut, defUniformNamed, div, dot, floor, glFragCoord, ifThen, insert, lt, mad, main, mix, mod, mul, neg, retFn, step, sub, subAssign, sw, texture, vec2, vec4 } from '../../../../shaders/shaderBuilder';

const LUMA = vec4( 0.2126, 0.7152, 0.0722, 0.0 );
export const ALIGN_SIZE = 64.0;

export const pixelSorterFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );
  const fragColor = defOut( 'vec4' );

  const comp = defUniformNamed( 'float', 'comp' );
  const dir = defUniformNamed( 'float', 'dir' );
  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const sampler0 = defUniformNamed( 'sampler2D', 'sampler0' );
  const sampler1 = defUniformNamed( 'sampler2D', 'sampler1' );

  main( () => {
    const texIndex = def( 'vec4', texture( sampler1, vUv ) );

    ifThen( lt( sw( texIndex, 'x' ), 0.5 ), () => {
      assign( fragColor, texture( sampler0, vUv ) );
      retFn();
    } );

    const index = sw( texIndex, 'x' );
    const width = add( index, sw( texIndex, 'y' ), -1.0 );

    const coordOrigin = def( 'vec2', sw( glFragCoord, 'xy' ) );
    subAssign( sw( coordOrigin, 'x' ), sub( index, 1.0 ) );

    const alignedIndex = def( 'float', floor( div( index, add( 1.0, width ), 1.0 / ALIGN_SIZE ) ) );
    const alignDelta = def( 'vec2', vec2( div( width, ALIGN_SIZE ), 0.0 ) );

    const isCompHigher = def( 'float', step(
      mod( alignedIndex, mul( 2.0, comp ) ),
      sub( comp, 1.0 ),
    ) );

    const compOffset = mix( neg( comp ), comp, isCompHigher );

    const coordA = mad( coordOrigin, alignDelta, alignedIndex );
    const coordB = mad( coordA, alignDelta, compOffset );

    const texA = texture( sampler0, div( coordA, resolution ) );
    const texB = texture( sampler0, div( coordB, resolution ) );

    const valueA = dot( texA, LUMA );
    const valueB = dot( texB, LUMA );

    const shouldSwap = def( 'float', step(
      mod( div( alignedIndex, mul( 2.0, dir ) ), 2.0 ),
      0.999,
    ) );
    const shouldSwap2 = mod( add( shouldSwap, isCompHigher, step( valueB, valueA ) ), 2.0 ); // TODO

    assign( fragColor, mix( texA, texB, shouldSwap2 ) );
  } );
} );
