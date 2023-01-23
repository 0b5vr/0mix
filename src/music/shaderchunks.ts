export const shaderchunkPre = `#version 300 es

precision highp float;

#define _PI 3.14159265359

uniform float bpm;
uniform vec4 timeLength;
uniform float sampleRate;
uniform vec4 timeHead;

in float off;

out float outL;
out float outR;
`;

export const shaderchunkPreLines = shaderchunkPre.split( '\n' ).length;

export const shaderchunkPost = `void main() {
  vec2 out2 = mainaudio( mod( timeHead + off / sampleRate, timeLength ) );
  outL = out2.x;
  outR = out2.y;
}`;
