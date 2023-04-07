import { BackgroundDefDrawType } from '../../utils/shaders/buildPlaneBackgroundFrag';
import { FAR } from '../../../config';
import { abs, defUniformNamed, mad, mul, sin, smoothstep, step, sub, sw, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { isectPlane } from '../../../shaders/modules/isectPlane';

export const section3Background: BackgroundDefDrawType = () => {
  const time = defUniformNamed( 'float', 'time' );

  return ( ro, rd ) => {
    const isect = isectPlane(
      sub( ro, vec3( 0.0, -4.0, 0.0 ) ),
      rd,
      vec3( 0.0, 1.0, 0.0 ),
    );
    const rp = mad( isect, rd, ro );

    const shape = mul(
      2.0,
      step( 0.9, sin( mad( 0.2, sw( rp, 'z' ), mul( 4.0, time ) ) ) ),
      smoothstep( 2.0, 1.0, abs( sw( rp, 'x' ) ) ),
      step( isect, FAR - 1E-3 ), // plane hit
    );

    return vec4(
      vec3( shape ),
      1.0,
    );
  };
};
