#version 300 es

precision highp float;

const float RADIUS = 40.0;
const vec3 CIRCLE_COLOR = vec3( 1.0, 1.0, 1.0 );

in vec2 vUv;

out vec4 fragColor;

uniform float lod;
uniform vec2 resolution;
uniform vec2 mouse;
uniform sampler2D sampler0;

bool print( vec2 coord, float value ) {
  ivec2 icoord = ivec2( floor( coord ) );

  // vertical restriction
  if ( icoord.y < 0 || 4 < icoord.y ) { return false; }

  // dot
  if ( 0 <= icoord.x && icoord.x < 2 ) {
    return icoord.x < 1 && icoord.y < 1;
  }

  // padded by dot
  if ( 2 <= icoord.x ) { icoord.x -= 2; }

  // determine digit
  int ci = ( icoord.x + 100 ) / 5 - 20 + 1;

  // too low / too high
  if ( 4 < ci ) { return false; }
  if ( ci < -4 ) { return false; }

  // x, y of char
  ivec2 cf = ivec2(
    ( icoord.x + 100 ) % 5,
    icoord.y
  );

  // width is 4
  if ( 4 == cf.x ) { return false; }

  // bit of char
  int cfbit = cf.x + 4 * cf.y;

  // determine char
  int num = 0;
  float n = abs( value );

  if ( 0 < ci ) {
    // int part
    for ( int i = 0; i < 6; i ++ ) {
      if ( ci < i ) { break; }

      num = int( n ) % 10;
      n *= 10.0;
    }
  } else {
    // frac part
    for ( int i = 0; i < 6; i ++ ) {
      if ( -ci < i ) { break; }

      if ( i != 0 && n < 1.0 ) {
        // minus
        return i == -ci && value < 0.0 && cf.y == 2 && 0 < cf.x;
      }

      num = int( n ) % 10;
      n /= 10.0;
    }
  }

  return ( 1 & ( (
    num == 0 ? 432534 :
    num == 1 ? 410692 :
    num == 2 ? 493087 :
    num == 3 ? 493191 :
    num == 4 ? 630408 :
    num == 5 ? 989063 :
    num == 6 ? 399254 :
    num == 7 ? 1016898 :
    num == 8 ? 431766 :
    433798
  ) >> cfbit ) ) == 1;
}

void main() {
  vec2 uv = vUv;
  vec2 coord = vUv * resolution;

  vec2 center = floor( mouse * resolution + vec2( 1.0, 0.7 ) * RADIUS );
  float circle = length( coord.xy - center ) - RADIUS;

  vec4 col = textureLod( sampler0, uv, lod );
  vec4 mcol = textureLod( sampler0, mouse, lod );
  float mcolb = dot( mcol.rgb, vec3( 0.299, 0.587, 0.114 ) );
  vec4 bcol = vec4( vec3( step( mcolb, 0.5 ) ), 1.0 );

  col = mix(
    col,
    mix(
      bcol,
      mcol,
      smoothstep( 1.0, 0.0, circle + 5.0 )
    ),
    smoothstep( 1.0, 0.0, circle )
  );

  if ( circle < 0.0 ) {
    col = print( coord.xy - center - vec2( 0.0, 8.0 ), mcol.x ) ? bcol : col;
    col = print( coord.xy - center - vec2( 0.0, 0.0 ), mcol.y ) ? bcol : col;
    col = print( coord.xy - center - vec2( 0.0, -8.0 ), mcol.z ) ? bcol : col;
    col = print( coord.xy - center - vec2( 0.0, -16.0 ), mcol.w ) ? bcol : col;
  }

  fragColor = col;
}
