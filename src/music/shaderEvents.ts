import { ShaderEventRange } from './ShaderEventRange';
import initGlsl from './shaders/init.glsl?raw';

export enum ShaderEventType {
  Insert,
  Delete,
  Select,
  Comment,
  Uncomment,
  Apply,
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
  type: ShaderEventType.Select,
  params: ShaderEventRange,
] | [
  beatOffset: number,
  type: ShaderEventType.Comment,
] | [
  beatOffset: number,
  type: ShaderEventType.Uncomment,
] | [
  beatOffset: number,
  type: ShaderEventType.Apply,
];

export const shaderEvents: ShaderEvent[] = [
  [ 8.0, ShaderEventType.Insert, initGlsl ],
  [ 1.0, ShaderEventType.Apply ],
  [ 64.0, ShaderEventType.Select, [ 120, 0, 120, 1 ] ],
  [ 2.0, ShaderEventType.Select, [ 126, 6, 126, 6 ] ],
  [ 2.0, ShaderEventType.Select, [ 126, 5, 135, 6 ] ],
  [ 0.5, ShaderEventType.Uncomment ],
  [ 0.5, ShaderEventType.Apply ],
  [ 14.0, ShaderEventType.Select, [ 145, 3, 145, 3 ] ],
  [ 2.0, ShaderEventType.Select, [ 145, 2, 149, 3 ] ],
  [ 2.0, ShaderEventType.Comment ],
  [ 0.5, ShaderEventType.Apply ],

  // osc 2 detune
  [ 14.0, ShaderEventType.Select, [ 212, 26, 212, 26 ] ],
  [ 2.0, ShaderEventType.Insert, '1' ],
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
  [ 3.0, ShaderEventType.Delete ],
  [ 0.25, ShaderEventType.Delete ],
  [ 0.25, ShaderEventType.Insert, '1' ],
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
  [ 1.0, ShaderEventType.Delete ],
  [ 0.25, ShaderEventType.Delete ],
  [ 0.25, ShaderEventType.Delete ],
  [ 0.25, ShaderEventType.Insert, '2' ],
  [ 0.25, ShaderEventType.Insert, '.' ],
  [ 0.5, ShaderEventType.Apply ],

  // osc 2 fm
  [ 6.0, ShaderEventType.Select, [ 212, 43, 212, 43 ] ],
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
  [ 3.0, ShaderEventType.Delete ],
  [ 0.25, ShaderEventType.Delete ],
  [ 0.25, ShaderEventType.Insert, '1' ],
  [ 0.25, ShaderEventType.Insert, '.' ],
  [ 0.25, ShaderEventType.Apply ],

  // osc polyrhythm + low cut
  [ 6.0, ShaderEventType.Select, [ 210, 52, 210, 52 ] ],
  [ 0.25, ShaderEventType.Delete ],
  [ 0.25, ShaderEventType.Delete ],
  [ 0.25, ShaderEventType.Insert, '1' ],
  [ 0.25, ShaderEventType.Insert, '.' ],
  [ 0.25, ShaderEventType.Insert, '7' ],
  [ 0.25, ShaderEventType.Insert, '5' ],
  [ 6.0, ShaderEventType.Select, [ 116, 3, 116, 3 ] ],
  [ 6.0, ShaderEventType.Select, [ 116, 2, 123, 3 ] ],
  [ 2.0, ShaderEventType.Comment ],
  [ 6.0, ShaderEventType.Select, [ 106, 6, 106, 6 ] ],
  [ 2.0, ShaderEventType.Uncomment ],
  [ 2.0, ShaderEventType.Apply ],

  // insert 2nd bass
  [ 6.0, ShaderEventType.Select, [ 191, 3, 191, 3 ] ],
  [ 2.0, ShaderEventType.Insert, `

  // bass
  {
    float t=mod(time.x,.25*b2t);
    float ptn[7]=float[](
      0.,12.,0.,17.,
      0.,13.,12.
    );
    int st=int(time.z*4.*t2b)%7;

    vec2 sum=vec2(0);

    // sub
    {
      float freq=p2f(24.+transpose+ptn[st]);
      sum+=.3*sin(2.*sin(tau*t*freq));
    }

    // unison fm
    for(int i=0;i<16;i++){
      vec3 dice=pcg3df(vec3(i,st,0));
      float freq=p2f(39.+transpose+ptn[st]+.2*(dice.x-.5));
      float phase=tau*t*freq+dice.y;

      vec2 fm2=.2*exp(-10.*t)*vec2(sin(7.77*phase))*r2d(tau*dice.x);
      vec2 fm=8.*exp(-3.*t)*vec2(sin(.5*p5*phase+fm2))*r2d(tau*dice.y);
      vec2 car=exp(-8.*t)*vec2(sin(phase+fm))*r2d(tau*dice.z);
      sum+=.15*car;
    }

    float zc=linearstep(0.,1E-3,t)*linearstep(0.,1E-3,.25*b2t-t);
    dest+=.0*sidechain*zc*sum;
  }` ],
  [ 6.0, ShaderEventType.Select, [ 223, 12, 223, 12 ] ],
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
  [ 0.25, ShaderEventType.Delete ],
  [ 0.25, ShaderEventType.Insert, '1' ],
  [ 0.25, ShaderEventType.Insert, '.' ],
  [ 0.25, ShaderEventType.Apply ],

  // insert 2nd drums
  [ 6.0, ShaderEventType.Select, [ 94, 20, 94, 20 ] ],
  [ 6.0, ShaderEventType.Select, [ 94, 20, 191, 6 ] ],
  [ 2.0, ShaderEventType.Insert, `

  // kick
  float kickt;
  float sidechain;

  {
    float t=kickt=time.x;
    sidechain=smoothstep(0.,.8*b2t,t);

    if(inrange(time.z,0.,61.*b2t)){
      float env=linearstep(0.3,0.1,t);
      // env*=exp(-100.*t); // hi pass like

      dest+=.5*env*tanh(2.*sin(
        310.*t-55.*exp(-30.*t)
        -30.*exp(-500.*t)
      ));
    }
  }

  // hihat
  {
    float t=mod(time.x,.25*b2t);
    float decay=time.y<3.75*b2t?90.:10.;
    dest+=.2*tanh(8.*shotgun(4000.*t,2.,.2))*exp(-decay*t);
  }

  // clap
  // {
  //   float t=mod(time.y-b2t,2.*b2t);

  //   float env=mix(
  //     exp(-30.*t),
  //     exp(-200.*mod(t,.013)),
  //     exp(-80.*max(0.,t-.02))
  //   );

  //   vec2 uv=orbit(87.*t)+20.*t;

  //   dest+=.23*tanh(20.*env*(vec2(
  //     texture(image_fbm,uv).x,
  //     texture(image_fbm,uv+.05).x
  //   )-.5));
  // }

  // ride
  // {
  //   float t=mod(time.y,.5*b2t);

  //   dest+=.15*sidechain*tanh(10.*shotgun(4200.*t,2.4,.4))*exp(-10.*t);
  // }

  // psysaw
  // {
  //   float t=mod(time.y,.25*b2t);
  //   int st=int(time.z*4.*t2b);
  //   vec3 dice=pcg3df(vec3(st));
  //   float l=(.25-dice.y*.2)*b2t;
  //   float freq=20.*sin(TAU*dice.z*2.);
  //   dest+=sidechain*.1*zcross(t,l,1E-3)*saw(20.*exp(-2.*fract(10.*exp(-freq*t))));
  // }

  // crash
  {
    float t=time.z;
    dest+=.2*mix(.2,1.,sidechain)*tanh(8.*shotgun(4000.*t,3.,.0))*mix(exp(-t),exp(-10.*t),.5);
  }` ],
  [ 2.0, ShaderEventType.Apply ],
];
