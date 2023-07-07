import { BackgroundDefDrawType } from '../../utils/shaders/buildPlaneBackgroundFrag';
import { FAR } from '../../../config';
import { MUSIC_BPM } from '../../../music/constants';
import { add, addAssign, cos, def, defUniformNamed, div, fract, length, mad, mix, mul, normalize, smoothstep, step, sub, sw, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { isectPlane } from '../../../shaders/modules/isectPlane';
import { phongSpecular } from '../../../shaders/modules/phongSpecular';

export const section3Background: BackgroundDefDrawType = () => {
  const time = defUniformNamed( 'float', 'time' );

  return ( ro, rd ) => {
    const isect = isectPlane(
      sub( ro, vec3( 0.0, -4.0, 0.0 ) ),
      rd,
      vec3( 0.0, 1.0, 0.0 ),
    );
    const rp = mad( isect, rd, ro );

    const rpt = def( 'vec3', rp );
    addAssign( sw( rpt, 'x' ), 1.0 );
    addAssign( sw( rpt, 'y' ), 3.9 );
    addAssign( sw( rpt, 'z' ), mad( 40.0, fract( mul( time, MUSIC_BPM / 240.0 ) ), -20.0 ) );

    // Ref: https://www.youtube.com/watch?v=Kb7ZtsbQNsM
    // shoutouts to LJ & Virgill
    const light = def( 'float', mul(
      div( 1.0, length( rpt ) ),
      smoothstep( -0.7, -1.0, sw( normalize( rpt ), 'z' ) ),
    ) );

    addAssign( sw( rpt, 'x' ), -2.0 );
    addAssign( light, mul(
      div( 1.0, length( rpt ) ),
      smoothstep( -0.7, -1.0, sw( normalize( rpt ), 'z' ) ),
    ) );

    const line = mul(
      step( cos( sw( rp, 'x' ) ), -0.95 ),
      step( cos( sw( rp, 'z' ) ), 0.0 ),
    );

    const shape = mul(
      mix( 0.02, 1.0, light ),
      mix( 3.0, 30.0, line ),
      step( isect, FAR - 1E-3 ), // plane hit
    );

    return vec4(
      vec3( add(
        shape,
        mul( 0.04, phongSpecular( rd, vec3( 1.0, 1.0, -1.0 ), 5.0 ) ),
      ) ),
      1.0,
    );
  };
};
