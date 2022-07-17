import { ShaderEventRange } from './ShaderEventRange';

export enum ShaderEventType {
  Insert,
  Select,
  Comment,
  Apply,
}

export type ShaderEvent = [
  beatOffset: number,
  type: ShaderEventType.Insert,
  code: string,
] | [
  beatOffset: number,
  type: ShaderEventType.Select,
  params: ShaderEventRange,
] | [
  beatOffset: number,
  type: ShaderEventType.Comment,
  indent: number,
] | [
  beatOffset: number,
  type: ShaderEventType.Apply,
];

export const shaderEvents: ShaderEvent[] = [
  [ 0.0, ShaderEventType.Insert, `#define PI 3.141592654
#define TAU 6.283185307
#define BPM bpm
#define P4 1.33483985417
#define P5 1.49830707688
#define beat *60.0/BPM

#define saturate(i) clamp(i, 0.,1.)
#define clip(i) clamp(i, -1.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))
#define lofi(i,m) (floor((i)/(m))*(m))
#define lofir(i,m) (floor((i)/(m)+0.5)*(m))
#define saw(p) (2.*fract(p)-1.)
#define pwm(x,d) (step(fract(x),(d))*2.0-1.0)
#define tri(p) (1.-4.*abs(fract(p)-0.5))
#define p2f(i) (pow(2.,((i)-69.)/12.)*440.)
#define fs(i) (fract(sin((i)*114.514)*1919.810))
#define inRange(a,b,x) ((a)<=(x)&&(x)<(b))

uniform sampler2D sample_hihat;
uniform vec4 sample_hihat_meta;
uniform sampler2D sample_noise;
uniform vec4 sample_noise_meta;
uniform sampler2D fbm;

float envA( float t, float a ) {
  return linearstep( 0.0, a, t );
}

float envAR( float t, float l, float a, float r ) {
  return envA( t, a ) * linearstep( l, l - r, t );
}

vec2 orbit( float t ) {
  return vec2( cos( TAU * t ), sin( TAU * t ) );
}

float chords[8] = float[](
  0.0, 0.0, 3.0, 3.0, 7.0, 7.0, 10.0, 14.0
);

float noise( float t ) {
  return sampleSinc( sample_noise, t );
}

float random2( float t ) {
  return fract( sampleSinc( sample_noise, t ) );
}

vec2 kick( float t, float freq ) {
  float phase = freq * t - 11.0 * ( exp( -25.0 * t ) + exp( -100.0 * t ) + exp( -700.0 * t ) );
  float fmA = sin( TAU * 1.0 * phase + 1.4 );
  vec2 fmB = 0.5 * exp( -20.0 * t ) * tri( 0.5 * phase + fmA + vec2( 0.2, 0.24 ) );
  return clip( 1.0 * vec2( exp( -4.0 * t ) * sin( TAU * phase + fmB ) ) );
}

vec2 rimshot( float t ) {
  if ( t < 0.0 ) { return vec2( 0.0 ); }
  float attack = exp( -t * 400.0 ) * 0.6;
  vec2 wave = (
    tri( t * 450.0 * vec2( 1.005, 0.995 ) - attack ) +
    tri( t * 1800.0 * vec2( 0.995, 1.005 ) - attack )
  );
  return clip( 4.0 * wave * exp( -t * 400.0 ) );
}

vec2 filterSaw( float freq, float time, float cutoff, float resonance ) {
  if ( time < 0.0 ) { return vec2( 0.0 ); }
  vec2 sum = vec2( 0.0 );
  for ( int i = 1; i <= 32; i ++ ) {
    float fi = float( i );
    float cut = smoothstep( cutoff * 1.2, cutoff * 0.8, fi * freq );
    cut += smoothstep( cutoff * 0.3, 0.0, abs( cutoff - fi * freq ) ) * resonance;
    vec2 offset = vec2( -1.0, 1.0 ) * ( 0.1 * ( fi - 1.0 ) );
    sum += sin( fi * freq * time * TAU + offset ) / fi * cut;
  }
  return sum;
}

vec2 mainAudio( vec4 time ) {
  vec2 dest = vec2( 0.0 );

  // kick
  float kickTime = mod( time.x, 1.0 beat );
  float sidechain = linearstep( 0.0, 0.6 beat, kickTime );

  if ( inRange( 0.0 beat, 61.0 beat, time.z ) ) {
    dest += 0.5 * kick( kickTime, 50.0 );
  }

  // hihat
  {
    float t = mod( time.x, 0.25 beat );

    float vel = fract( floor( time.y / ( 0.25 beat ) ) * 0.62 + 0.67 );
    float amp = mix( 0.2, 0.3, vel );
    float decay = mix( 140.0, 10.0, vel );
    dest += amp * sampleSinc( sample_hihat, t ) * exp( -t * decay );
  }

  // rim
  {
    float t = mod( time.x, 0.25 beat );
    float st = mod( floor( ( time.z ) / ( 0.25 beat ) ), 256.0 );

    if ( fract( st * 0.71 + 0.5 ) > 0.5 ) {
      dest += 0.3 * rimshot( t );
    }
  }

  // bass
  {
    // float t = mod( aTime - 0.5 beat, 1.0 beat );
    float t = mod( time.x, 0.25 beat );
    float decay = exp( -20.0 * t );
    float cutoff = mix( 100.0, 500.0, decay );
    float noteI = 0.0;
    float trans = mod( time.z, 16.0 beat ) < ( 12.0 beat ) ? 0.0 : -2.0;
    float freq = p2f( 30.0 + trans );
    vec2 wave = filterSaw( freq, t + 0.004 * sin( TAU * 2.0 * freq * t ), cutoff, 1.0 );
    dest += 0.4 * sidechain * decay * wave;
  }

  // arp
  {
    vec2 wave = vec2( 0.0 );

    for ( int i = 0; i < 4; i ++ ) {
      float fi = float( i );
      float t = mod( time.x, 0.25 beat );
      float st = mod( floor( ( time.z - fi * 0.75 beat ) / ( 0.25 beat ) ), 256.0 );

      float dice = random2( 0.81 * fi );

      float arpseed = fract( 0.615 * st );
      float trans = mod( st, 64.0 ) < 48.0 ? 0.0 : -2.0;
      float note = chords[ int( arpseed * 24.0 ) % 8 ] + 12.0 * floor( arpseed * 3.0 ) + trans;
      float freq = p2f( 42.0 + note );

      float env = exp( -t * 10.0 );
      vec2 amp = saturate( 0.5 + vec2( 0.5, -0.5 ) * sin( 2.0 * fi + time.w ) * fi ) * exp( -fi ) * env;

      vec2 phase = t * freq + mix( vec2( 1.0, 0.0 ), vec2( 0.0, 1.0 ), dice );
      wave += amp * (
        + saw( phase )
        + saw( P5 * phase )
        + pwm( 0.2 + 0.5 * phase, vec2( 0.5 ) )
        + pwm( 1.5 * phase, vec2( 0.5 ) )
      );
    }

    dest += 0.24 * sidechain * wave;
  }

  // pad
  {
    vec2 sum = vec2( 0.0 );

    int pitchTable[8] = int[]( 0, 3, 7, 10, 12, 14, 19, 26 );

    for ( int i = 0; i < 48; i ++ ) {
      float fi = float( i );

      float t = time.z;

      float trans = mod( time.z, 16.0 beat ) < ( 12.0 beat ) ? 0.0 : -2.0;
      float freq = p2f( float( 42 + pitchTable[ i % 8 ] ) + trans )
        * mix( 0.99, 1.01, fs( fi ) );
      float offu = fs( fi + 4.0 );
      vec2 pan = mix( vec2( 0.0, 1.0 ), vec2( 1.0, 0.0 ), fi / 47.0 );

      vec2 uv = vec2( 0.5 );
      uv += 0.5 * time.z;
      vec2 uv1 = uv + 0.05 * orbit( freq * t + offu );
      vec2 uv2 = uv + 0.05 * orbit( freq * t + offu + 0.13 );
      float diff = texture( fbm, uv1 ).x - texture( fbm, uv2 ).x;

      float amp = 0.2 * mix( 0.3, 1.0, sidechain );
      sum += amp * pan * diff; // fbm osc
    }

    dest += clip( sum );
  }

  return clip( dest );
}` ],
  [ 0.0, ShaderEventType.Apply ],
  [ 20.0, ShaderEventType.Select, [ 98, 0, 98, 0 ] ],
  [ 2.0, ShaderEventType.Select, [ 91, 0, 98, 3 ] ],
  [ 2.0, ShaderEventType.Comment, 2 ],
  [ 3.0, ShaderEventType.Apply ],
];
