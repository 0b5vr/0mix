import { Music } from '../music/Music';
import { automatonSetupMusic } from './automaton';

export const audio = new AudioContext();
export const sampleRate = audio.sampleRate;

const music = new Music();
music.compile( `
#define BPM bpm
#define BEAT (60.0/BPM)
#define TRANSPOSE -3.0

#define PI 3.14159265359
#define TAU 6.28318530718
#define LN2 0.69314718056
#define LN10 2.30258509299

#define saturate(i) clamp(i,0.,1.)
#define clip(i) clamp(i,-1.,1.)
#define fs(i) (fract(sin((i)*114.514)*1919.810))
#define lofi(i,j) (floor((i)/(j))*(j))
#define n2f(n) (pow(2.0,((n)+TRANSPOSE)/12.0)*440.0)

uniform sampler2D sample_noise;
uniform vec4 sample_noise_meta;

float decibellToVoltage( float decibell ) {
  return pow( 10.0, decibell / 20.0 );
}

float declick( float t ) {
  return 1.0 - exp( -max( 0.0, t ) * 1E3 );
}

float declickl( float t, float len ) {
  return declick( t ) * declick( len - t );
}

vec2 noise( float t ) {
  return sampleSinc( sample_noise, sample_noise_meta, mod( t, sample_noise_meta.w ) );
}

vec2 kick( float t ) {
  if ( t < 0.0 ) { return vec2( 0.0 ); }

  vec2 tt = t + 0.002 * exp( -4.0 * t ) * noise( 0.004 * t );
  vec2 a = exp( -4.0 * tt ) * sin( TAU * (
    50.0 * tt - 2.0 * ( exp( -20.0 * tt ) + exp( -100.0 * t ) )
  ) );
  return clip( 1.5 * a );
}

vec2 hihat( float t, float open ) {
  float decay = exp( -open * t );
  vec2 sig = noise( 0.7 * t ).xy;
  sig -= noise( 0.7 * t + 0.007 ).xy;
  return sig * decay;
}

vec2 snare( float t ) {
  float decay = exp( -t * 20.0 );
  vec2 snappy = 0.5 + 0.5 * noise( t ).xy;
  vec2 head = sin( TAU * ( t * 280.0 * vec2( 1.005, 0.995 ) - exp( -t * 100.0 ) ) );
  return clip( ( 3.0 * snappy * head ) * decay );
}

vec2 filterSaw( float freq, float time, float cutoff, float resonance ) {
  if ( time < 0.0 ) { return vec2( 0.0 ); }
  vec2 sum = vec2( 0.0 );
  for ( int i = 1; i <= 64; i ++ ) {
    float fi = float( i );
    float octCut = log( cutoff ) / LN2;
    float octFreq = log( fi * freq ) / LN2;
    float octDiff = octFreq - octCut;
    float cutDB = min( 0.0, -24.0 * octDiff );
    cutDB += smoothstep( 0.5, 0.0, abs( octDiff ) ) * resonance;
    vec2 offset = vec2( -1.0, 1.0 ) * ( 0.1 * ( fi - 1.0 ) );
    sum += sin( fi * freq * time * TAU + offset ) / fi * decibellToVoltage( cutDB );
  }
  return sum;
}

vec2 mainAudio( vec4 time ) {
  vec2 dest = vec2( 0.0 );

  float sidechain = smoothstep( 0.0, 0.6 * BEAT, time.x );
  {
    float t = time.x;
    dest += 0.5 * kick( t ) * declickl( t + 0.1, BEAT + 0.1 );
  }

  {
    float t = mod( time.z, 0.25 * BEAT );
    vec4 dice = fs( lofi( time.y, 0.25 * BEAT ) + 19.28 * vec4( 0, 1, 2, 3 ) );
    float open = mix( 30.0, 70.0, dice.y );
    dest += 0.3 * mix( 0.2, 1.0, sidechain ) * hihat( t, open );
  }

  {
    dest += 0.4 * mix( 0.6, 1.0, sidechain ) * snare( mod( time.y - 1.0 * BEAT, 2.0 * BEAT ) );
  }

  {
    float t = mod( time.y, 0.25 * BEAT );
    vec4 dice = fs( lofi( time.y, 0.25 * BEAT ) + 3.88 * vec4( 0, 1, 2, 3 ) );

    float pattern[6] = float[](
      0.0, 12.0, 17.0, 0.0, 13.0, 12.0
    );
    float freq = n2f( -24.0 + pattern[ int( time.z / ( 0.25 * BEAT ) ) % 6 ] );

    float filt = (
      400.0 +
      mix( 1000.0, 4000.0, dice.x ) * exp( -mix( 10.0, 40.0, dice.y ) * t )
    );

    float amp = 0.3;
    vec2 a = filterSaw( freq, t, filt, 12.0 );
    dest += 0.3 * mix( 0.6, 1.0, sidechain ) * declickl( t, mix( 0.15, 0.25, dice.z ) * BEAT ) * declickl( t, 0.25 * BEAT ) * clip( a );
  }

  return dest;
}
` )
  .then( () => music.applyCue() );

automatonSetupMusic( music );

export { music };
