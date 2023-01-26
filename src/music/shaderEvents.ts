export enum ShaderEventType {
  Insert,
  Delete,
  Move,
  MoveStart,
  MoveEnd,
  Comment,
  Uncomment,
  Apply,
  JumpPart,
  ExpandSelectBack,
  ExpandSelectForward,
}

export type ShaderEvent = [
  beatOffset: number,
  type: ShaderEventType.Insert,
  code: string,
] | [
  beatOffset: number,
  type: ShaderEventType.Delete,
] | [
  beatOffset: number,
  type: ShaderEventType.Comment,
] | [
  beatOffset: number,
  type: ShaderEventType.Uncomment,
] | [
  beatOffset: number,
  type: ShaderEventType.Apply,
] | [
  beatOffset: number,
  type: ShaderEventType.Move,
  params: [ number, number ],
] | [
  beatOffset: number,
  type: ShaderEventType.MoveStart,
  params: [ number, number ],
] | [
  beatOffset: number,
  type: ShaderEventType.MoveEnd,
  params: [ number, number ],
] | [
  beatOffset: number,
  type: ShaderEventType.JumpPart,
  jump: -1 | 1,
] | [
  beatOffset: number,
  type: ShaderEventType.ExpandSelectBack,
] | [
  beatOffset: number,
  type: ShaderEventType.ExpandSelectForward,
];

export const shaderEvents: ShaderEvent[] = [
  [ 0.0, ShaderEventType.Insert, `#define saturate(i) clamp(i,0.,1.)
#define clip(i) clamp(i,-1.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))
#define lofi(i,m) (floor((i)/(m))*(m))
#define tri(p) (1.-4.*abs(fract(p)-0.5))
#define p2f(i) (exp2(((i)-69.)/12.)*440.)

const float pi=acos(-1.);
const float tau=2.*pi;
const float p4=exp2(5./12.);
const float p5=exp2(7./12.);
const float b2t=60./140.;
const float t2b=1./b2t;

uvec3 pcg3d(uvec3 v){
  v=v*1145141919u+1919810u;
  v.x+=v.y*v.z;
  v.y+=v.z*v.x;
  v.z+=v.x*v.y;
  v^=v>>16u;
  v.x+=v.y*v.z;
  v.y+=v.z*v.x;
  v.z+=v.x*v.y;
  return v;
}

vec3 pcg3df(vec3 v){
  uvec3 r=pcg3d(floatBitsToUint(v));
  return vec3(r)/float(0xffffffffu);
}

mat2 r2d(float x){
  float c=cos(x),s=sin(x);
  return mat2(c,s,-s,c);
}

mat3 orthbas(vec3 z){
  z=normalize(z);
  vec3 x=normalize(cross(vec3(0,1,0),z));
  vec3 y=cross(z,x);
  return mat3(x,y,z);
}

vec3 cyclic(vec3 p,float pump){
  vec4 sum=vec4(0);
  mat3 rot=orthbas(vec3(2,-3,1));

  for(int i=0;i<5;i++){
    p*=rot;
    p+=sin(p.zxy);
    sum+=vec4(cross(cos(p),sin(p.yzx)),1);
    sum*=pump;
    p*=2.;
  }

  return sum.xyz/sum.w;
}

vec2 orbit(float t){
  return vec2(cos(tau*t),sin(tau*t));
}

vec2 shotgun(float t,float spread,float snap){
  vec2 sum=vec2(0);
  for(int i=0;i<64;i++){
    vec3 dice=pcg3df(vec3(i));

    float partial=exp2(spread*dice.x);
    partial=mix(partial,floor(partial+.5),snap);

    sum+=vec2(sin(tau*t*partial))*r2d(tau*dice.y);
  }
  return sum/64.;
}

float cheapfiltersaw(float phase,float k){
  float wave=mod(phase,1.);
  float c=.5+.5*cos(pi*saturate(wave/k));
  return (wave+c)*2.-1.-k;
}

vec2 boxmuller(vec2 xi){
  float r=sqrt(-2.*log(xi.x));
  float t=xi.y;
  return r*orbit(t);
}

vec2 mainaudio(vec4 time){
  vec2 dest=vec2(0);

  float sidechain=1.;

  { // kick
    float t=time.x;
    sidechain=smoothstep(0.,1E-3,b2t-t)*smoothstep(0.,.8*b2t,t);

    {
      float env=linearstep(0.3,0.1,t);

      // { // hi pass like
      //   env*=exp(-50.*t);
      // }

      dest+=.6*env*tanh(2.*sin(
        300.*t-20.*exp(-40.*t)
        -5.*exp(-400.*t)
      ));
    }
  }

  { // sub kick
    float t=mod(time.x-.25*b2t,.25*b2t);

    float zc=linearstep(0.,.002,t)*linearstep(0.,.002,.25*b2t-t);
    float env=exp(-10.*t);
    float wave=sin(310.*t-2.*exp(-80.*t));
    dest+=.5*sidechain*zc*env*wave;
  }

  { // low freq noise
    float t=time.x;

    vec2 wave=cyclic(vec3(200.*t),3.).xy;
    dest+=.14*sidechain*wave;
  }

  { // hihat
    float t=mod(time.x-.5*b2t,1.*b2t);
    float env=exp(-20.*t);
    dest+=.18*env*tanh(8.*shotgun(5400.*t,1.4,.0));
  }

  // { // ride
  //   float t=mod(time.y,.5*b2t);

  //   dest+=.1*sidechain*tanh(10.*shotgun(3200.*t,3.4,.1))*exp(-10.*t);
  // }

  { // perc
    float tp=mod(time.y,2.*b2t);
    float t=mod(mod(tp,.75*b2t),.5*b2t);
    float st=(tp-t)*4.*t2b;

    float tone=fract(.3+st*.422);
    vec2 wave=cyclic(
      32.*vec3(orbit(exp2(6.+2.*tone)),exp2(4.+3.*tone)*t),
      1.5
    ).xy;

    float env=mix(
      exp(-30.*t),
      exp(-5.*t),
      0.2
    );
    dest+=.4*sidechain*env*tanh(2.*wave);
  }

  { // clav
    float t=mod(mod(time.y,2.25*b2t),.5*b2t);

    float wave=sin(17000.*t);
    dest+=.2*exp(-t*200.)*vec2(wave)*r2d(1.4);
  }

  { // rim
    float t=mod(mod(time.y-.25*b2t,1.25*b2t),.5*b2t);

    float env=exp(-300.*t);
    dest+=.3*env*tanh(4.*(
      +tri(t*400.-.5*env)
      +tri(t*1500.-.5*env)
    ))*vec2(1,-1);
  }

  { // dual vco
    vec2 sum=vec2(0);

    for(int i=0;i<8;i++){
      float fi=float(i);

      const float freqs[3]=float[](560.,1200.,240.);
      const float times[3]=float[](.25,.75,1.5);

      for(int j=0;j<3;j++){
        float t=mod(time.z-times[j]*b2t-.5*b2t*fi,2.*b2t);
        vec2 wave=vec2(sin(tau*freqs[j]*t));
        wave+=vec2(sin(1.0*tau*freqs[j]*t+.0*wave)); // osc 2
        sum+=exp(-30.*max(t-.05,0.))*exp(-2.*fi)*wave*r2d(fi+10.*time.w);
      }
    }

    dest+=.1*sum;
  }

  return tanh(1.5*dest);
}` ],
  [ 0.0, ShaderEventType.Move, [ -1000, 0 ] ],
  [ 0.0, ShaderEventType.Move, [ 0, -1000 ] ],
  [ 1.0, ShaderEventType.Apply ],

  // ride unmute
  [ 16.0, ShaderEventType.JumpPart, 1 ],
  [ 0.5, ShaderEventType.JumpPart, 1 ],
  [ 0.5, ShaderEventType.JumpPart, 1 ],
  [ 0.5, ShaderEventType.JumpPart, 1 ],
  [ 0.5, ShaderEventType.JumpPart, 1 ],
  [ 0.5, ShaderEventType.JumpPart, 1 ],
  [ 0.5, ShaderEventType.JumpPart, 1 ],
  [ 0.5, ShaderEventType.JumpPart, 1 ],
  [ 1.0, ShaderEventType.JumpPart, 1 ],
  [ 0.5, ShaderEventType.JumpPart, 1 ],
  [ 2.5, ShaderEventType.JumpPart, 1 ],
  [ 0.8, ShaderEventType.JumpPart, 1 ],
  [ 0.5, ShaderEventType.JumpPart, 1 ],
  [ 0.5, ShaderEventType.JumpPart, 1 ],
  [ 0.5, ShaderEventType.JumpPart, 1 ],
  [ 1.0, ShaderEventType.JumpPart, 1 ],
  [ 2.0, ShaderEventType.JumpPart, 1 ],
  [ 1.0, ShaderEventType.JumpPart, 1 ],
  [ 1.5, ShaderEventType.JumpPart, 1 ],
  [ 3.5, ShaderEventType.Uncomment ],

  // dual vco detune
  [ 3.5, ShaderEventType.JumpPart, 1 ],
  [ 1.5, ShaderEventType.JumpPart, 1 ],
  [ 1.0, ShaderEventType.JumpPart, 1 ],
  [ 1.0, ShaderEventType.JumpPart, 1 ],
  [ 1.5, ShaderEventType.JumpPart, 1 ],
  [ 1.5, ShaderEventType.JumpPart, 1 ],
  [ 3.0, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.5, ShaderEventType.Move, [ -1, 0 ] ],
  [ 0.5, ShaderEventType.Move, [ -1, 0 ] ],
  [ 1.0, ShaderEventType.Move, [ 0, 1 ] ],
  [ 1.0, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.5, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.5, ShaderEventType.Move, [ 0, 1 ] ],
  [ 2.0, ShaderEventType.Insert, '1' ],
  [ 8.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '2' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '3' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '4' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '5' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '6' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '8' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.2, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '1' ],
  [ 0.2, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '2' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '3' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '4' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '5' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '6' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '7' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '8' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '9' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 2.0, ShaderEventType.Delete ],
  [ 0.25, ShaderEventType.Delete ],
  [ 0.25, ShaderEventType.Delete ],
  [ 0.25, ShaderEventType.Insert, '2' ],
  [ 0.25, ShaderEventType.Insert, '.' ],
  [ 0.5, ShaderEventType.Apply ],

  // dual vco fm
  [ 2.0, ShaderEventType.Move, [ 0, 100 ] ],
  [ 1.0, ShaderEventType.Move, [ 0, -1 ] ],
  [ 1.0, ShaderEventType.Move, [ 0, -1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, -1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, -1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, -1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, -1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, -1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, -1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, -1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, -1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, -1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, -1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, -1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, -1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, -1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, -1 ] ],
  [ 0.6, ShaderEventType.Move, [ 0, -1 ] ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '1' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '2' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '3' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '4' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '6' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '8' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.2, ShaderEventType.Delete ],
  [ 0.2, ShaderEventType.Insert, '1' ],
  [ 0.2, ShaderEventType.Insert, '.' ],
  [ 0.2, ShaderEventType.Apply ],

  // dual vco polyrhythm
  [ 3.0, ShaderEventType.Move, [ -1, 0 ] ],
  [ 0.5, ShaderEventType.Move, [ -1, 0 ] ],
  [ 1.0, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.3, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.7, ShaderEventType.Delete ],
  [ 0.2, ShaderEventType.Delete ],
  [ 1.0, ShaderEventType.Insert, '1' ],
  [ 0.2, ShaderEventType.Insert, '.' ],
  [ 0.2, ShaderEventType.Insert, '7' ],
  [ 0.2, ShaderEventType.Insert, '5' ],

  // low cut
  [ 4.0, ShaderEventType.JumpPart, -1 ],
  [ 0.5, ShaderEventType.JumpPart, -1 ],
  [ 0.5, ShaderEventType.JumpPart, -1 ],
  [ 0.5, ShaderEventType.JumpPart, -1 ],
  [ 0.5, ShaderEventType.JumpPart, -1 ],
  [ 0.5, ShaderEventType.JumpPart, -1 ],
  [ 0.5, ShaderEventType.JumpPart, -1 ],
  [ 0.5, ShaderEventType.JumpPart, -1 ],
  [ 1.0, ShaderEventType.JumpPart, -1 ],
  [ 1.5, ShaderEventType.JumpPart, -1 ],
  [ 2.5, ShaderEventType.Comment ],
  [ 2.0, ShaderEventType.JumpPart, -1 ],
  [ 4.0, ShaderEventType.Uncomment ],
  [ 4.0, ShaderEventType.Apply ],

  // insert 2nd bass
  [ 5.0, ShaderEventType.JumpPart, 1 ],
  [ 2.0, ShaderEventType.Uncomment ],
  [ 4.0, ShaderEventType.Insert, `{ // bass
    float t=mod(time.x,.25*b2t);
    float ptn[7]=float[](
      0.,12.,0.,17.,
      0.,13.,12.
    );
    int st=int(time.z*4.*t2b)%7;

    vec2 sum=vec2(0);

    { // sub
      float freq=p2f(22.+ptn[st]);
      sum+=.3*sin(2.*sin(tau*t*freq));
    }

    for(int i=0;i<16;i++){ // unison fm
      vec3 dice=pcg3df(vec3(i,st,0));
      float freq=p2f(37.+ptn[st]+.2*(dice.x-.5));
      float phase=tau*t*freq+dice.y;

      vec2 fm2=.2*exp(-10.*t)*vec2(sin(7.77*phase))*r2d(tau*dice.x);
      vec2 fm=8.*exp(-3.*t)*vec2(sin(.5*p5*phase+fm2))*r2d(tau*dice.y);
      vec2 car=exp(-8.*t)*vec2(sin(phase+fm))*r2d(tau*dice.z);
      sum+=.13*car;
    }

    float zc=linearstep(0.,1E-3,t)*linearstep(0.,1E-3,.25*b2t-t);
    dest+=.0*sidechain*zc*sum;
  }` ],
  [ 2.5, ShaderEventType.Move, [ -1, 0 ] ],
  [ 0.2, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.2, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.2, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.2, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.2, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.2, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.2, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.2, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.2, ShaderEventType.Move, [ 0, 1 ] ],
  [ 1.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '2' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '4' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '6' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '8' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.25, ShaderEventType.Delete ],
  [ 0.25, ShaderEventType.Insert, '1' ],
  [ 0.25, ShaderEventType.Insert, '.' ],
  [ 0.25, ShaderEventType.Apply ],

  // insert 2nd stuff
  [ 4.0, ShaderEventType.JumpPart, 1 ],
  [ 2.4, ShaderEventType.ExpandSelectForward ],
  [ 0.4, ShaderEventType.ExpandSelectForward ],
  [ 0.4, ShaderEventType.ExpandSelectForward ],
  [ 0.4, ShaderEventType.ExpandSelectForward ],
  [ 0.7, ShaderEventType.ExpandSelectForward ],
  [ 4.0, ShaderEventType.Insert, `{ // hihat
    float t=mod(time.x,.25*b2t);
    float decay=time.y<3.75*b2t?90.:10.;
    float env=exp(-decay*t);
    dest+=.25*env*tanh(8.*shotgun(4000.*t,2.,.2));
  }

  // { // clap
  //   float t=mod(time.y-b2t,2.*b2t);

  //   float env=mix(
  //     exp(-30.*t),
  //     exp(-200.*mod(t,.013)),
  //     exp(-80.*max(0.,t-.02))
  //   );

  //   vec2 wave=cyclic(vec3(4.*orbit(200.*t),440.*t),1.5).xy;
  //   dest+=.2*tanh(20.*env*wave);
  // }

  // { // ride
  //   float t=mod(time.y,.5*b2t);

  //   dest+=.15*sidechain*tanh(10.*shotgun(4200.*t,2.4,.4))*exp(-10.*t);
  // }

  // { // psysaw
  //   float t=mod(time.y,.25*b2t);
  //   int st=int(time.z*4.*t2b);
  //   vec3 dice=pcg3df(vec3(st));
  //   float l=(.25-dice.y*.2)*b2t;
  //   float freq=20.*sin(tau*dice.z*2.);
  //   float fm=fract(10.*exp(-freq*t));
  //   float wave=fract(20.*exp(-2.*fm))-.5;
  //   float zc=linearstep(0.,1E-3,t)*linearstep(0.,1E-3,l-t);
  //   dest+=sidechain*.2*zc*wave;
  // }

  { // crash
    float t=time.z;
    float env=mix(exp(-t),exp(-10.*t),.5);
    vec2 wave=shotgun(4000.*t,3.,.0);
    dest+=.3*mix(.2,1.,sidechain)*tanh(8.*wave)*env;
  }` ],

  // insert 2nd kick
  [ 4.0, ShaderEventType.JumpPart, -1 ],
  [ 0.4, ShaderEventType.JumpPart, -1 ],
  [ 0.4, ShaderEventType.JumpPart, -1 ],
  [ 0.4, ShaderEventType.JumpPart, -1 ],
  [ 0.4, ShaderEventType.JumpPart, -1 ],
  [ 0.4, ShaderEventType.JumpPart, -1 ],
  [ 0.4, ShaderEventType.JumpPart, -1 ],
  [ 0.4, ShaderEventType.JumpPart, -1 ],
  [ 0.4, ShaderEventType.JumpPart, -1 ],
  [ 2.4, ShaderEventType.JumpPart, -1 ],
  [ 1.0, ShaderEventType.Comment ],
  [ 1.1, ShaderEventType.JumpPart, -1 ],
  [ 2.7, ShaderEventType.Apply ],
  [ 4.0, ShaderEventType.Insert, `{ // kick
    float t=time.x;
    sidechain=smoothstep(0.,1E-3,b2t-t)*smoothstep(0.,.8*b2t,t);

    if(time.z<61.*b2t){
      float env=linearstep(0.3,0.1,t);

      // { // hi pass like
      //   env*=exp(-100.*t);
      // }

      dest+=.6*env*tanh(2.*sin(
        310.*t-55.*exp(-30.*t)
        -30.*exp(-500.*t)
      ));
    }
  }` ],
  [ 0.5, ShaderEventType.Apply ],

  // fade out dual vco
  [ 4.0, ShaderEventType.Move, [ 1000, 0 ] ],
  [ 4.0, ShaderEventType.Move, [ -1, 0 ] ],
  [ 0.8, ShaderEventType.Move, [ -1, 0 ] ],
  [ 0.8, ShaderEventType.Move, [ -1, 0 ] ],
  [ 1.5, ShaderEventType.Move, [ -1, 0 ] ],
  [ 2.0, ShaderEventType.Move, [ 0, 1000 ] ],
  [ 1.0, ShaderEventType.Move, [ 0, -1 ] ],
  [ 0.2, ShaderEventType.Move, [ 0, -1 ] ],
  [ 0.2, ShaderEventType.Move, [ 0, -1 ] ],
  [ 0.2, ShaderEventType.Move, [ 0, -1 ] ],
  [ 0.2, ShaderEventType.Move, [ 0, -1 ] ],
  [ 1.5, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '0' ],
  [ 0.1, ShaderEventType.Insert, '8' ],
  [ 0.4, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '6' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '4' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '2' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '1' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Apply ],

  // prepare chord
  [ 3.0, ShaderEventType.JumpPart, -1 ],
  [ 2.0, ShaderEventType.JumpPart, -1 ],
  [ 1.5, ShaderEventType.JumpPart, -1 ],
  [ 5.0, ShaderEventType.Insert, `{ // chord
    float chord[8]=float[](
      0.,5.,7.,12.,14.,19.,22.,29.
    );
    vec2 sum=vec2(0);

    float t=time.z;

    for(int i=0;i<64;i++){
      vec3 dice=pcg3df(vec3(i));

      float freq=p2f(57.+chord[i%8]+.1*boxmuller(dice.xy).x);
      float phase=freq*t;
      float wave=cheapfiltersaw(phase,.02)-cheapfiltersaw(phase,.2);
      sum+=vec2(wave)*r2d(tau*dice.z);
    }

    dest+=.0*mix(.2,1.,sidechain)*sum/32.;
  }` ],

  // unmute clap
  [ 3.0, ShaderEventType.JumpPart, -1 ],
  [ 0.8, ShaderEventType.JumpPart, -1 ],
  [ 0.8, ShaderEventType.JumpPart, -1 ],
  [ 0.8, ShaderEventType.JumpPart, -1 ],
  [ 0.8, ShaderEventType.JumpPart, -1 ],
  [ 2.0, ShaderEventType.JumpPart, -1 ],
  [ 2.0, ShaderEventType.Uncomment ],
  [ 2.5, ShaderEventType.Apply ],

  // unmute ride
  [ 1.0, ShaderEventType.JumpPart, 1 ],
  [ 2.0, ShaderEventType.Uncomment ],
  [ 0.5, ShaderEventType.Apply ],

  // unmute clap
  [ 4.0, ShaderEventType.JumpPart, 1 ],
  [ 2.0, ShaderEventType.Uncomment ],
  [ 25.5, ShaderEventType.Apply ],

  // kick cut
  [ 18.0, ShaderEventType.JumpPart, -1 ],
  [ 1.0, ShaderEventType.JumpPart, -1 ],
  [ 0.7, ShaderEventType.JumpPart, -1 ],
  [ 0.7, ShaderEventType.JumpPart, -1 ],
  [ 0.7, ShaderEventType.JumpPart, -1 ],
  [ 0.7, ShaderEventType.JumpPart, -1 ],
  [ 0.7, ShaderEventType.JumpPart, -1 ],
  [ 4.0, ShaderEventType.Uncomment ],
  [ 4.5, ShaderEventType.Apply ],

  // chord fadein
  [ 2.0, ShaderEventType.Move, [ 1000, 0 ] ],
  [ 0.3, ShaderEventType.Move, [ -1, 0 ] ],
  [ 0.3, ShaderEventType.Move, [ -1, 0 ] ],
  [ 0.3, ShaderEventType.Move, [ -1, 0 ] ],
  [ 0.6, ShaderEventType.Move, [ -1, 0 ] ],
  [ 0.7, ShaderEventType.Uncomment ],
  [ 0.8, ShaderEventType.Move, [ 0, 1 ] ],
  [ 1.0, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.8, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.5, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '1' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '2' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '3' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '4' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '5' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '6' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '7' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '8' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '9' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 4.0, ShaderEventType.Comment ],
  [ 2.0, ShaderEventType.JumpPart, -1 ],
  [ 0.5, ShaderEventType.JumpPart, -1 ],
  [ 0.5, ShaderEventType.JumpPart, -1 ],
  [ 0.5, ShaderEventType.JumpPart, -1 ],
  [ 0.5, ShaderEventType.JumpPart, -1 ],
  [ 0.5, ShaderEventType.JumpPart, -1 ],
  [ 0.5, ShaderEventType.JumpPart, -1 ],
  [ 0.5, ShaderEventType.JumpPart, -1 ],
  [ 0.8, ShaderEventType.JumpPart, -1 ],
  [ 0.8, ShaderEventType.JumpPart, -1 ],
  [ 0.8, ShaderEventType.JumpPart, -1 ],
  [ 1.8, ShaderEventType.JumpPart, -1 ],
  [ 2.2, ShaderEventType.JumpPart, 1 ],
  [ 1.0, ShaderEventType.Comment ],
  [ 8.0, ShaderEventType.Apply ],

  // insert kick + bass 3rd
  [ 16.0, ShaderEventType.JumpPart, -1 ],
  [ 0.5, ShaderEventType.JumpPart, -1 ],
  [ 6.0, ShaderEventType.Insert, `{ // kick
    float tp=mod(time.y,2.*b2t);
    float t=mod(tp,.75*b2t);
    float l=mix(.75*b2t,.5*b2t,step(1.5*b2t,tp));
    sidechain=smoothstep(0.,1E-3,l-t)*smoothstep(0.,.8*b2t,t);

    float env=linearstep(.0,.001,t)*linearstep(0.3,0.1,t);

    float wave=mix(
      sin(300.*t-65.*exp(-80.*t)),
      sin(200.*t-15.*exp(-40.*t)),
      step(60.*b2t,time.z)
    );
    dest+=.6*tanh(3.*env*wave);
  }

  { // bass
    float t=mod(time.y,2.*b2t);

    vec2 sum=vec2(.5*sin(tau*45.*t));

    for(int i=0;i<8;i++){
      vec3 dice=pcg3df(vec3(i));
      float freq=45.+.1*boxmuller(dice.xy).x;
      float phase=freq*t+dice.z;
      float screech=2.*smoothstep(57.*b2t,61.*b2t,time.z);
      vec3 p=vec3(10.*t*orbit(phase),screech*sin(tau*31.*phase));
      sum+=.25*cyclic(p,4.).xy*r2d(tau*float(i)/8.+time.z);
    }

    dest+=.6*sidechain*tanh(sum);
  }` ],

  // mutate bass
  [ 4.0, ShaderEventType.JumpPart, 1 ],
  [ 1.0, ShaderEventType.JumpPart, 1 ],
  [ 1.5, ShaderEventType.Comment ],
  [ 3.0, ShaderEventType.Move, [ 1, 0 ] ],
  [ 1.0, ShaderEventType.Move, [ 1, 0 ] ],
  [ 0.1, ShaderEventType.Move, [ 1, 0 ] ],
  [ 0.1, ShaderEventType.Move, [ 1, 0 ] ],
  [ 0.1, ShaderEventType.Move, [ 1, 0 ] ],
  [ 0.1, ShaderEventType.Move, [ 1, 0 ] ],
  [ 0.1, ShaderEventType.Move, [ 1, 0 ] ],
  [ 0.1, ShaderEventType.Move, [ 1, 0 ] ],
  [ 0.5, ShaderEventType.Move, [ 1, 0 ] ],
  [ 1.0, ShaderEventType.Move, [ 0, 6 ] ],
  [ 1.0, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.1, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.7, ShaderEventType.Move, [ 0, -1 ] ],
  [ 1.5, ShaderEventType.Insert, '4' ],
  [ 0.2, ShaderEventType.Insert, '.' ],
  [ 0.4, ShaderEventType.Insert, '*' ],

  // insert percussions 3rd
  [ 5.0, ShaderEventType.JumpPart, 1 ],
  [ 2.0, ShaderEventType.ExpandSelectForward ],
  [ 1.0, ShaderEventType.ExpandSelectForward ],
  [ 1.0, ShaderEventType.ExpandSelectForward ],
  [ 2.0, ShaderEventType.Insert, '' ],
  [ 6.0, ShaderEventType.Insert, `{ // rim
    float t=mod(mod(mod(time.y-1.*b2t,2.*b2t),.75*b2t),.5*b2t); // .xx. x.xx

    float env=exp(-300.*t);
    dest+=.3*env*tanh(4.*(
      +tri(t*400.-.5*env)
      +tri(t*1500.-.5*env)
    ))*vec2(1,-1);
  }

  { // fm perc
    float t=mod(time.x,.25*b2t);
    t=lofi(t,1E-4);
    float st=floor(time.z/.25/b2t);
    vec3 dice=pcg3df(vec3(st));

    float freq=exp2(8.+3.*dice.x);
    float env=exp(-exp2(3.+5.*dice.y)*t);
    float fm=env*exp2(3.+3.*dice.z)*sin(freq*exp(-t));
    float wave=sin(fm);
    dest+=.1*mix(.2,1.,sidechain)*vec2(wave)*r2d(st);
  }` ],
  [ 5.5, ShaderEventType.Apply ],

  // fadeout 2nd bass
  [ 2.0, ShaderEventType.JumpPart, -1 ],
  [ 0.8, ShaderEventType.JumpPart, -1 ],
  [ 0.8, ShaderEventType.JumpPart, -1 ],
  [ 0.8, ShaderEventType.JumpPart, -1 ],
  [ 0.9, ShaderEventType.JumpPart, -1 ],
  [ 2.0, ShaderEventType.Move, [ 0, 1 ] ],
  [ 1.0, ShaderEventType.Move, [ -1, 0 ] ],
  [ 0.3, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.3, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.3, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.3, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.3, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.3, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.7, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.3, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.3, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.5, ShaderEventType.Delete ],
  [ 0.2, ShaderEventType.Delete ],
  [ 2.0, ShaderEventType.Insert, '.' ],
  [ 0.3, ShaderEventType.Insert, '8' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '6' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '4' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '2' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '1' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '0' ],
  [ 0.5, ShaderEventType.Apply ],

  // hihat + additive shepard
  [ 2.0, ShaderEventType.Move, [ 1, 0 ] ],
  [ 1.0, ShaderEventType.Insert, '\n  ' ],
  [ 1.0, ShaderEventType.Insert, '\n  ' ],
  [ 4.0, ShaderEventType.Insert, `{ // hihat
    float t=mod(time.x,.25*b2t);
    float st=floor(time.y/.25/b2t);

    float env=exp(-40.*t);
    env*=linearstep(.0,.001,t);

    vec2 wave=cyclic(vec3(6000.*t),1.2).xy;

    dest+=.4*sidechain*env*tanh(5.*wave);
  }` ],

  [ 2.0, ShaderEventType.Move, [ 1000, 0 ] ],
  [ 2.0, ShaderEventType.JumpPart, -1 ],
  [ 1.0, ShaderEventType.JumpPart, -1 ],
  [ 4.5, ShaderEventType.Insert, `{ // additive shepard
    vec2 sum=vec2(0.);

    for(int i=0;i<2500;i++){
      vec3 diceA=pcg3df(vec3(i/50));
      vec3 diceB=pcg3df(vec3(i));

      float t=mod(time.z-diceA.x*(64.*b2t),64.*b2t);

      float tone=5.+8.*diceA.y+.15*diceB.y;
      float freq=exp2(tone);
      vec2 phase=(t+.5*t*t/(64.*b2t))*freq+fract(diceB.xy*999.);
      phase+=.1*fract(32.*phase); // add high freq

      sum+=sin(tau*phase)*sin(pi*t/(64.*b2t))/1250.;
    }

    dest+=.0*mix(.2,1.,sidechain)*sum;
  }` ],
  [ 3.0, ShaderEventType.Move, [ -1, 0 ] ],
  [ 1.2, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.2, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.2, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.2, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.2, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.2, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.2, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.2, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.2, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.3, ShaderEventType.Move, [ 0, 1 ] ],
  [ 1.6, ShaderEventType.Move, [ 0, -1 ] ],
  [ 0.5, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '1' ],
  [ 2.0, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '2' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '3' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '4' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '5' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '6' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '7' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '8' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '9' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 1.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Delete ],
  [ 1.0, ShaderEventType.Insert, '1' ],
  [ 0.5, ShaderEventType.Insert, '.' ],
  [ 0.5, ShaderEventType.Insert, '0' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '2' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '4' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '6' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 4.0, ShaderEventType.JumpPart, -1 ],
  [ 1.0, ShaderEventType.JumpPart, -1 ],
  [ 0.7, ShaderEventType.JumpPart, -1 ],
  [ 0.7, ShaderEventType.JumpPart, -1 ],
  [ 2.7, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.4, ShaderEventType.Insert, '\n  ' ],
  [ 0.4, ShaderEventType.Insert, '\n  ' ],
  [ 4.5, ShaderEventType.Insert, `{ // hihat 2
    float t=mod(time.x,.25*b2t);
    float st=floor(time.y/.25/b2t);

    float env=exp(-exp2(3.+2.*fract(.4+.628*st))*t);
    env*=linearstep(.0,.001,t);

    vec2 wave=shotgun(4000.*t,3.,.5);

    dest+=.4*sidechain*env*tanh(5.*wave);
  }

  { // clap
    float t=mod(time.y-3.*b2t,4.*b2t);

    float env=exp(-40.*t)+.02*exp(-5.*t);

    t+=0.1*sin(t*90.0);
    vec3 p=vec3(10.*orbit(59.8*t),+250.*t);
    vec2 wave=cyclic(p,2.).xy;

    dest+=.2*tanh(20.*env*wave);
  }` ],
  [ 2.5, ShaderEventType.Apply ],

  // insert arp + pad 4th, fade in arp
  [ 8.0, ShaderEventType.JumpPart, -1 ],
  [ 3.0, ShaderEventType.ExpandSelectBack ],
  [ 3.0, ShaderEventType.Insert, '' ],
  [ 2.0, ShaderEventType.JumpPart, -1 ],
  [ 2.0, ShaderEventType.JumpPart, -1 ],
  [ 2.0, ShaderEventType.ExpandSelectBack ],
  [ 3.0, ShaderEventType.Insert, '' ],
  [ 2.0, ShaderEventType.JumpPart, 1 ],
  [ 1.0, ShaderEventType.JumpPart, 1 ],
  [ 1.0, ShaderEventType.JumpPart, 1 ],
  [ 1.5, ShaderEventType.Move, [ 0, 1 ] ],
  [ 1.0, ShaderEventType.Insert, '\n  ' ],
  [ 0.5, ShaderEventType.Insert, '\n  ' ],
  [ 6.5, ShaderEventType.Insert, `
  float trans=mod(time.z,16.*b2t)<(12.*b2t)?0.:0.;

  { // arp
    vec2 sum=vec2(0);
    const float chord[8] = float[](
      0.,0.,3.,3.,7.,7.,10.,14.
    );

    for(int i=0;i<4;i++){
      float fi=float(i);
      float t=mod(time.x,.25*b2t);
      float st=mod(floor((time.z-.75*b2t*fi)/(.25*b2t)),256.);

      float arpseed=fract(.615*st);
      float note=42.+chord[int(arpseed*24.)%8]+12.*floor(arpseed*3.)+trans;
      float freq=p2f(note);
      vec2 phase=t*freq+vec2(.5,0);

      sum+=2.*exp(-10.*t)*exp(-fi)*(
        +fract(phase)-.5
        +step(fract(.2+.5*phase),vec2(.03))
        -step(fract(.7+.5*phase),vec2(.03))
        // +fract(p5*phase)-.5
        // +step(fract(1.5*phase),vec2(.5))-.5
      )*r2d(time.w);
    }

    dest+=.0*mix(.2,1.,sidechain)*sum;
  }

  { // pad
    vec2 sum=vec2(0);

    const float pitchTable[8]=float[](0.,3.,7.,10.,12.,14.,19.,26.);

    for(int i=0;i<48;i++){
      float fi=float(i);
      vec3 dice=pcg3df(vec3(fi));

      float t=time.z;

      float note=42.+float(pitchTable[i%8])+trans+.1*boxmuller(dice.xy).x;
      float freq=p2f(note);
      float phase=freq*t+dice.z;

      vec3 p1=vec3(2.*orbit(phase),t);
      vec3 p2=vec3(2.*orbit(phase+.05),t);
      vec2 wave=cyclic(p1,2.).xy-cyclic(p2,2.).xy;

      sum+=mix(.2,1.,sidechain)*wave*r2d(fi)/24.;
    }

    dest+=.0*tanh(sum);
  }` ],
  [ 2.0, ShaderEventType.JumpPart, -1 ],
  [ 1.0, ShaderEventType.JumpPart, -1 ],
  [ 2.0, ShaderEventType.JumpPart, -1 ],
  [ 3.0, ShaderEventType.Move, [ 0, 1 ] ],
  [ 1.0, ShaderEventType.Move, [ 1, 0 ] ],
  [ 0.5, ShaderEventType.Move, [ 1, 0 ] ],
  [ 2.2, ShaderEventType.Move, [ 0, 4 ] ],
  [ 0.7, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.2, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.2, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.2, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.2, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.2, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.2, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.2, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.3, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.7, ShaderEventType.Move, [ 0, -1 ] ],
  [ 1.0, ShaderEventType.Insert, '1' ],
  [ 10.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '2' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '3' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '4' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '5' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '6' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '7' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '8' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 2.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Delete ],
  [ 0.8, ShaderEventType.Insert, '1' ],
  [ 0.7, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Insert, '2' ],
  [ 1.0, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '4' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '6' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '8' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 2.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Delete ],
  [ 0.7, ShaderEventType.Insert, '2' ],
  [ 0.8, ShaderEventType.Apply ],

  // mute shepard, insert
  [ 2.0, ShaderEventType.JumpPart, -1 ],
  [ 1.0, ShaderEventType.JumpPart, -1 ],
  [ 1.0, ShaderEventType.JumpPart, -1 ],
  [ 1.0, ShaderEventType.JumpPart, -1 ],
  [ 4.0, ShaderEventType.Insert, `{ // snareroll
    float roll=mix(.25*b2t,.125*b2t,step(56.*b2t,time.z));
    float t=mod(time.x,roll);

    vec3 p=vec3(10.*orbit(500.*t),1000.*t);
    vec2 wave=cyclic(p,1.4).xy;
    float phase=250.*t-5.*exp(-80.*t);
    wave+=sin(tau*phase+.1*sin(.33*tau*phase));

    float amp=linearstep(0.,60.*b2t,time.z);
    amp*=amp;
    float env=exp(-12.*t);
    dest+=amp*.6*mix(.5,1.,sidechain)*tanh(env*wave);
  }` ],
  [ 2.5, ShaderEventType.Apply ],

  // insert kick + bass 4th
  [ 6.0, ShaderEventType.Move, [ 1, 0 ] ],
  [ 0.5, ShaderEventType.Move, [ 1, 0 ] ],
  [ 0.5, ShaderEventType.Move, [ 1, 0 ] ],
  [ 4.0, ShaderEventType.MoveEnd, [ 1, 0 ] ],
  [ 0.0, ShaderEventType.Insert, '' ], // pretend to be cut + paste
  [ 3.0, ShaderEventType.JumpPart, 1 ],
  [ 2.0, ShaderEventType.Move, [ 0, 1 ] ],
  [ 1.0, ShaderEventType.Move, [ -1, 0 ] ],
  [ 0.4, ShaderEventType.Move, [ -1, 0 ] ],
  [ 0.4, ShaderEventType.Move, [ -1, 0 ] ],
  [ 0.4, ShaderEventType.Move, [ -1, 0 ] ],
  [ 0.4, ShaderEventType.Move, [ -1, 0 ] ],
  [ 1.0, ShaderEventType.Uncomment ],
  [ 1.0, ShaderEventType.Move, [ -1, 0 ] ],
  [ 1.0, ShaderEventType.Uncomment ],
  [ 3.0, ShaderEventType.JumpPart, -1 ],
  [ 1.0, ShaderEventType.JumpPart, -1 ],
  [ 0.7, ShaderEventType.JumpPart, -1 ],
  [ 0.8, ShaderEventType.JumpPart, -1 ],
  [ 1.0, ShaderEventType.JumpPart, -1 ],
  [ 1.5, ShaderEventType.ExpandSelectBack ],
  [ 3.5, ShaderEventType.ExpandSelectBack ],
  [ 1.0, ShaderEventType.ExpandSelectBack ],
  [ 1.0, ShaderEventType.ExpandSelectBack ],
  [ 1.0, ShaderEventType.ExpandSelectBack ],
  [ 2.0, ShaderEventType.ExpandSelectBack ],
  [ 2.0, ShaderEventType.Insert, 'float trans=mod(time.z,16.*b2t)<(12.*b2t)?0.:0.;' ],
  [ 2.0, ShaderEventType.Move, [ 0, -1 ] ],
  [ 0.5, ShaderEventType.Move, [ 0, -1 ] ],
  [ 1.0, ShaderEventType.Delete ],
  [ 1.5, ShaderEventType.Insert, '-' ],
  [ 0.2, ShaderEventType.Insert, '2' ],
  [ 3.0, ShaderEventType.Move, [ 1, 0 ] ],
  [ 0.5, ShaderEventType.Move, [ 1, 0 ] ],
  [ 2.0, ShaderEventType.Insert, `{ // kick
    float t=time.x;
    sidechain=smoothstep(0.,1E-3,b2t-t)*smoothstep(0.,.8*b2t,t);

    if(time.z<61.*b2t){
      float env=linearstep(0.3,0.1,t);

      float phase=50.*t-11.*(exp(-25.*t)+exp(-100.*t)+exp(-700.*t));
      phase+=.2*exp(-20.*t)*sin(tau*phase+1.); // fm attack mod
      float wave=sin(tau*phase);

      dest+=.5*env*tanh(2.*wave);
    }
  }

  { // bass
    float t=mod(time.x,.25*b2t);

    float env=exp(-10.*t);

    float note=30.+trans;
    float freq=p2f(note);
    vec2 sum=env*vec2(sin(tau*freq*t));

    for(int i=0;i<16;i++){
      vec3 dice=pcg3df(vec3(i,floor(time.x/.25/b2t),0));

      float noteu=note+.5*(dice.y-.5);
      float frequ=p2f(noteu);
      float phaseu=frequ*(t+.014*sin(tau*2.*frequ*t))+dice.z;

      float k=mix(.3,.02,exp(-10.*t));
      sum+=env*vec2(cheapfiltersaw(phaseu,k))*r2d(tau*dice.x+1.)/8.;
    }

    float zc=linearstep(0.,1E-3,t)*linearstep(0.,1E-2,.25*b2t-t);
    dest+=.5*zc*sidechain*tanh(2.*sum);
  }

  // { // hihat
  //   float t=mod(time.x,.25*b2t);
  //   float st=floor(time.y/.25/b2t);

  //   float vel=fract(st*.62+.67);
  //   float env=exp(-exp2(7.-3.*vel)*t);
  //   vec2 wave=shotgun(4000.*t,2.,.0);
  //   dest+=.25*env*sidechain*tanh(8.*wave);
  // }

  // { // rim
  //   float t=mod(time.y,.25*b2t);
  //   float st=floor(time.z/.25/b2t);

  //   float env=exp(-300.*t);
  //   dest+=.3*step(.5,fract(st*.71+.4))*env*tanh(4.*(
  //     +tri(t*400.-.5*env)
  //     +tri(t*1500.-.5*env)
  //   ))*vec2(1,-1);
  // }

  // { // perc
  //   float t=mod(time.y-1.*b2t,2.*b2t);

  //   dest+=.15*tanh(10.*shotgun(1100.*t,1.5,.4))*exp(-4.*t);
  // }` ],
  [ 1.0, ShaderEventType.JumpPart, 1 ],
  [ 1.0, ShaderEventType.JumpPart, 1 ],
  [ 3.0, ShaderEventType.Insert, '' ],
  [ 5.5, ShaderEventType.Apply ],

  // unmute hihat + rim
  [ 5.0, ShaderEventType.JumpPart, -1 ],
  [ 1.0, ShaderEventType.JumpPart, -1 ],
  [ 1.0, ShaderEventType.JumpPart, -1 ],
  [ 1.0, ShaderEventType.JumpPart, -1 ],
  [ 2.0, ShaderEventType.Uncomment ],
  [ 2.0, ShaderEventType.JumpPart, 1 ],
  [ 2.0, ShaderEventType.Uncomment ],
  [ 2.0, ShaderEventType.JumpPart, 1 ],

  // fade in pad
  [ 1.5, ShaderEventType.JumpPart, 1 ],
  [ 0.5, ShaderEventType.JumpPart, 1 ],
  [ 1.5, ShaderEventType.JumpPart, 1 ],
  [ 1.0, ShaderEventType.JumpPart, 1 ],
  [ 1.5, ShaderEventType.Move, [ 0, 1 ] ],
  [ 2.5, ShaderEventType.Move, [ -1, 0 ] ],
  [ 1.0, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.2, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.2, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.2, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.2, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.2, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.2, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.4, ShaderEventType.Move, [ 0, 1 ] ],
  [ 0.4, ShaderEventType.Move, [ 0, 1 ] ],
  [ 1.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '2' ],
  [ 6.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '4' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '6' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '8' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 3.0, ShaderEventType.Delete ],
  [ 0.5, ShaderEventType.Insert, '9' ],
  [ 0.5, ShaderEventType.Apply ],
  [ 2.7, ShaderEventType.Delete ],
  [ 0.2, ShaderEventType.Delete ],
  [ 0.2, ShaderEventType.Insert, '1' ],
  [ 0.3, ShaderEventType.Insert, '.' ],
  [ 0.5, ShaderEventType.Apply ],

  // unmute snare
  [ 3.0, ShaderEventType.JumpPart, -1.0 ],
  [ 0.4, ShaderEventType.JumpPart, -1.0 ],
  [ 0.4, ShaderEventType.JumpPart, -1.0 ],
  [ 0.4, ShaderEventType.JumpPart, -1.0 ],
  [ 0.4, ShaderEventType.JumpPart, -1.0 ],
  [ 0.4, ShaderEventType.JumpPart, -1.0 ],
  [ 2.2, ShaderEventType.Uncomment ],
  [ 0.5, ShaderEventType.Apply ],

  // mute percussions
  [ 32.0, ShaderEventType.ExpandSelectBack ],
  [ 1.0, ShaderEventType.ExpandSelectBack ],
  [ 3.0, ShaderEventType.Insert, '' ],
  [ 32.0, ShaderEventType.Apply ],

  // fadeout
  [ 3.0, ShaderEventType.JumpPart, -1 ],
  [ 1.0, ShaderEventType.JumpPart, -1 ],
  [ 1.0, ShaderEventType.JumpPart, -1 ],
  [ 2.0, ShaderEventType.Comment ],
  [ 3.0, ShaderEventType.Move, [ 1000, 0 ] ],
  [ 3.0, ShaderEventType.Move, [ -1, 0 ] ],
  [ 1.0, ShaderEventType.Move, [ 0, 1000 ] ],
  [ 0.5, ShaderEventType.Move, [ 0, -1 ] ],
  [ 2.0, ShaderEventType.Insert, '*' ],
  [ 0.3, ShaderEventType.Insert, 's' ],
  [ 0.2, ShaderEventType.Insert, 'm' ],
  [ 0.3, ShaderEventType.Insert, 'o' ],
  [ 0.3, ShaderEventType.Insert, 'o' ],
  [ 0.4, ShaderEventType.Insert, 't' ],
  [ 0.3, ShaderEventType.Insert, 'h' ],
  [ 0.3, ShaderEventType.Insert, 's' ],
  [ 0.2, ShaderEventType.Insert, 't' ],
  [ 0.2, ShaderEventType.Insert, 'e' ],
  [ 0.5, ShaderEventType.Insert, 'p' ],
  [ 0.6, ShaderEventType.Insert, '(' ],
  [ 1.5, ShaderEventType.Insert, '6' ],
  [ 0.2, ShaderEventType.Insert, '4' ],
  [ 0.3, ShaderEventType.Insert, '.' ],
  [ 0.5, ShaderEventType.Insert, '*' ],
  [ 0.4, ShaderEventType.Insert, 'b' ],
  [ 0.2, ShaderEventType.Insert, '2' ],
  [ 0.2, ShaderEventType.Insert, 't' ],
  [ 0.3, ShaderEventType.Insert, ',' ],
  [ 1.5, ShaderEventType.Insert, '3' ],
  [ 0.2, ShaderEventType.Insert, '2' ],
  [ 0.3, ShaderEventType.Insert, '.' ],
  [ 0.5, ShaderEventType.Insert, '*' ],
  [ 0.4, ShaderEventType.Insert, 'b' ],
  [ 0.2, ShaderEventType.Insert, '2' ],
  [ 0.2, ShaderEventType.Insert, 't' ],
  [ 0.3, ShaderEventType.Insert, ',' ],
  [ 0.2, ShaderEventType.Insert, 't' ],
  [ 0.2, ShaderEventType.Insert, 'i' ],
  [ 0.2, ShaderEventType.Insert, 'm' ],
  [ 0.3, ShaderEventType.Insert, 'e' ],
  [ 0.4, ShaderEventType.Insert, '.' ],
  [ 0.7, ShaderEventType.Insert, 'z' ],
  [ 0.5, ShaderEventType.Insert, ')' ],
  [ 1.0, ShaderEventType.Apply ],
  [ 6.6, ShaderEventType.Insert, '*' ],
  [ 0.5, ShaderEventType.Insert, '0' ],
  [ 0.2, ShaderEventType.Insert, '.' ],
  [ 26.0, ShaderEventType.Apply ],

  // greets
  [ 3.0, ShaderEventType.MoveStart, [ -1000, 0 ] ],
  [ 0.0, ShaderEventType.MoveStart, [ 0, -1000 ] ],
  [ 0.0, ShaderEventType.MoveEnd, [ 1000, 0 ] ],
  [ 0.0, ShaderEventType.MoveEnd, [ 0, 1000 ] ], // pretend to be select all
  [ 1.0, ShaderEventType.Insert, '' ],
  [ 4.0, ShaderEventType.Insert, `// 0b5vr glsl techno live set by 0b5vr
// 64kb webgl intro

// shoutouts to:
//   0x4015, alcatraz, altair, cncd, cocoon,
//   conspiracy, ctrl+alt+test, epoch, fairlight,
//   farbrausch, limp ninja, logicoma, loonies,
//   mercury, mfx, mrdoob, ninjadev, orange,
//   prismbeings, rgba, satori, slay bells, still

// press esc to exit...` ],

  [ 10000.0, ShaderEventType.Move, [ -1, 0 ] ],
];
