import { BackgroundDefDrawType } from '../../utils/shaders/buildPlaneBackgroundFrag';
import { FAR } from '../../../config';
import { abs, add, defUniformNamed, mad, mul, sin, smoothstep, step, sub, sw, vec3, vec4 } from '../../../shaders/shaderBuilder';
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

    const shape = mul(
      10.0,
      smoothstep( 0.98, 1.0, sin( mad( 0.2, sw( rp, 'z' ), mul( 4.0, time ) ) ) ),
      smoothstep( 0.5, 0.0, abs( sub( abs( sw( rp, 'x' ) ), 1.0 ) ) ),
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
