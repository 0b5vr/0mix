import { SAMPLE_TEXTURE_SIZE } from './constants';

export const shaderchunkPre = `#version 300 es

precision highp float;

#define _PI 3.14159265359

uniform float bpm;
uniform vec4 timeLength;
uniform float sampleRate;
uniform float _deltaSample;
uniform vec4 _timeHead;

in float off;

out float outL;
out float outR;

float paramFetch( vec4 param ) {
  return mix( param.x, param.y, exp( -param.z * off * _deltaSample ) );
}

float sampleSinc( sampler2D s, float time ) {
  float sum = 0.0;
  float def = -fract( time * sampleRate );
  for ( int i = -5; i <= 5; i ++ ) {
    float deft = def + float( i );
    vec2 uv = (
      floor(
        ( time * sampleRate + float( i ) )
        /
        vec2( 1.0, ${ SAMPLE_TEXTURE_SIZE }.0 )
      ) + 0.5
    ) / ${ SAMPLE_TEXTURE_SIZE }.0;
    sum += texture( s, uv ).x * min( sin( deft * _PI ) / deft / _PI, 1.0 );
  }
  return sum;
}
`;

export const shaderchunkPreLines = shaderchunkPre.split( '\n' ).length;

export const shaderchunkPost = `void main() {
  vec2 out2 = mainAudio( mod( _timeHead + off * _deltaSample, timeLength ) );
  outL = out2.x;
  outR = out2.y;
}`;
