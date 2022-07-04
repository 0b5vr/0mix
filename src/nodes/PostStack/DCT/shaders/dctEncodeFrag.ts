import { glslLofir } from '../../../../shaders/modules/glslLofir';
import { add, addAssign, assign, build, cos, def, defConst, defOut, defUniformNamed, div, divAssign, exp, float, glFragCoord, insert, int, ivec2, length, main, mat3, mul, mulAssign, step, subAssign, sw, texelFetch, unrollLoop, vec2, vec3, vec4 } from '../../../../shaders/shaderBuilder';
import { PI } from '../../../../utils/constants';

export const dctEncodeFrag = ( isVert: boolean, isDecode: boolean ) => build( () => {
  insert( 'precision highp float;' );

  const fragColor = defOut( 'vec4' );

  const amp = defUniformNamed( 'float', 'amp' );
  const sampler0 = defUniformNamed( 'sampler2D', 'sampler0' );

  const rgb2ycbcr = defConst( 'mat3', mat3(
    0.2126, -0.114572, 0.5,
    0.7152, -0.385428, -0.454153,
    0.0722, 0.5, -0.045847,
  ) );

  const ycbcr2rgb = defConst( 'mat3', mat3(
    1.0, 1.0, 1.0,
    0.0, -0.187324, 1.8556,
    1.5748, -0.468124, 0.0,
  ) );

  main( () => {
    const sum = def( 'vec3', vec3( 0.0 ) );
    const origin = def( 'ivec2', ivec2( sw( glFragCoord, 'xy' ) ) );
    const freq2 = def( 'ivec2', `${ origin }%16` as any );
    const freq = def( 'int', sw( freq2, isVert ? 'y' : 'x' ) );
    const ffreq = def( 'float', float( freq ) );
    subAssign( origin, isVert ? ivec2( 0.0, freq ) : ivec2( freq, 0.0 ) );

    unrollLoop( 16, ( i ) => {
      const coeff = isDecode
        ? cos( mul( PI * i / 16.0, add( ffreq, 0.5 ) ) )
        : div(
          cos( mul( PI * ( i + 0.5 ) / 16.0, ffreq ) ),
          add( 1.0, step( ffreq, 0.0 ) ),
        );

      const x = def( 'vec3', sw( texelFetch( sampler0, ivec2( origin ), int( 0 ) ), 'xyz' ) );
      isDecode || isVert || ( assign( x, mul( rgb2ycbcr, x ) ) );
      isDecode && isVert && ( assign( x, mul( ycbcr2rgb, x ) ) );
      addAssign( sum, mul( coeff, vec3( x ) ) );

      addAssign( origin, isVert ? ivec2( 0, 1 ) : ivec2( 1, 0 ) );
    } );

    if ( !isDecode ) {
      if ( isVert ) {
        const factor = mul( amp, length( vec2( freq2 ) ) );
        assign( sum, glslLofir( sum, mul( vec3( 0.5, 3.0, 3.0 ), add( 0.01, factor ) ) ) );
        mulAssign( sum, exp( mul( factor, vec3( 0.5, 1.0, 1.0 ) ) ) );
      }
    } else {
      divAssign( sum, 8.0 );
    }

    assign( fragColor, vec4( sum, 1.0 ) );
  } );
} );
