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
#define beat *60./BPM

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

float envA(float t,float a){
  return linearstep(0.,a,t);
}

float envAR(float t,float l,float a,float r){
  return envA(t,a)*linearstep(l,l-r,t);
}

vec2 orbit(float t){
  return vec2(cos(TAU*t),sin(TAU*t));
}

float noise(float t){
  return sampleSinc(sample_noise,t);
}

float random2(float t){
  return fract(sampleSinc(sample_noise,t));
}

vec2 filterSaw(float freq,float phase,float cutoff,float reso){
  vec2 sum = vec2(0);
  for(int i=1;i<=64;i++){
    float fi=float(i);
    float freqp=freq*fi;
    float omega=freqp/cutoff;
    float omegaSq=omega*omega;

    float a=4.0*reso+omegaSq*omegaSq-6.0*omegaSq+1.0;
    float b=4.0*omega*(omegaSq-1.0);
    float cut=1.0/sqrt(a*a+b*b);
    float offset=atan(a,b);

    sum+=0.66*sin(fi*phase*TAU-offset)/fi*cut;
  }
  return sum;
}

vec2 mainAudio(vec4 time){
  vec2 dest = vec2(0);

  // kick
  float kickTime=mod(time.x,1. beat);
  float sidechain=linearstep(0.,.6 beat,kickTime);

  if (inRange(0.,61. beat,time.z)){
    float t=kickTime;

    float phase=50.*t-11.*(exp(-25.*t)+exp(-100.*t)+exp(-700.*t));
    float fmA=sin(TAU*1.*phase+1.4);
    vec2 fmB=.5*exp(-20.*t)*tri(.5*phase+fmA+vec2(.2,.24));
    dest+=.5*clip(1.*vec2(exp(-4.*t)*sin(TAU*phase+fmB)));
  }

  // hihat
  {
    float t=mod(time.x,.25 beat);

    float vel=fract(floor(time.y/(.25 beat))*.62+.67);
    float amp=mix(.2,.3,vel);
    float decay=mix(140.,10.,vel);
    dest+=amp*sampleSinc(sample_hihat,t)*exp(-t*decay);
  }

  // rim
  {
    float t=mod(time.x,.25 beat);
    float st=mod(floor((time.z)/(.25 beat)),256.);

    if(fract(st*0.71+0.5)>0.5){
      float a=exp(-t*400.)*.6;
      vec2 osc=(
        tri(t*450.*vec2(1.005,.995)-a)+
        tri(t*1800.*vec2(.995,1.005)-a)
      );
      dest+=.3*clip(4.*osc*exp(-t*400.));
    }
  }

  // bass
  {
    float t=mod(time.x,.25 beat);
    float decay=exp(-20.*t);
    float cutoff=mix(200.,700.,decay);
    float noteI=0.;
    float trans=mod(time.z,16. beat)<(12. beat)?0.:-2.;
    float freq=p2f(30.+trans);
    vec2 wave=filterSaw(freq,freq*t+.1*sin(TAU*2.*freq*t),cutoff,.7);
    dest+=.6*sidechain*exp(-10.*t)*clip(3.*wave);
  }

  // arp
  {
    vec2 wave=vec2(0);

    int chord[8]=int[](0,0,3,3,7,7,10,14);

    for(int i=0;i<4;i++){
      float fi=float(i);
      float t=mod(time.x,.25 beat);
      float st=mod(floor((time.z-fi*.75 beat)/(.25 beat)),256.);

      float dice=random2(.81*fi);

      float arpseed=fract(.615*st);
      float trans=mod(st,64.)<48.?0.:-2.;
      float note=float(chord[int(arpseed*24.)%8])+12.*floor(arpseed*3.)+trans;
      float freq=p2f(42.+note);

      float env=exp(-t*10.);
      vec2 amp=saturate(.5+vec2(.5,-.5)*sin(2.*fi+time.w)*fi)*exp(-fi)*env;

      vec2 phase=t*freq+mix(vec2(1,0),vec2(0,1),dice);
      wave+=amp*(
        +saw(phase)
        +saw(P5*phase)
        +pwm(.2+.5*phase,vec2(.5))
        +pwm(1.5*phase,vec2(.5))
      );
    }

    dest+=0.24*sidechain*wave;
  }

  // pad
  {
    vec2 sum=vec2(0);

    int chord[8]=int[](0,3,7,10,12,14,19,26);

    for(int i=0;i<48;i++){
      float fi=float(i);

      float t=time.z;

      float trans=mod(time.z,16. beat)<(12. beat)?0.:-2.;
      float freq=p2f(float(42+chord[i%8])+trans)
        * mix(.99,1.01,fs(fi));
      float offu=fs(fi+4.);
      vec2 pan=mix(vec2(0,1),vec2(1,0),fi/47.0);

      vec2 uv=vec2(offu+.5*time.z);
      uv+=.04*orbit(1.*freq*t);
      uv+=.02*orbit(2.*freq*t);
      float tex=texture(fbm,uv).x-.5;

      float amp=.2*mix(.3,1.,sidechain);
      sum+=amp*pan*tex; // fbm osc
    }

    dest+=clip(sum);
  }

  return clip(dest);
}` ],
  [ 0.0, ShaderEventType.Apply ],
  [ 20.0, ShaderEventType.Select, [ 87, 0, 87, 0 ] ],
  [ 2.0, ShaderEventType.Select, [ 79, 0, 87, 3 ] ],
  [ 2.0, ShaderEventType.Comment, 2 ],
  [ 3.0, ShaderEventType.Apply ],
];
