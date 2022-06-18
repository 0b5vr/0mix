import { sub, vec3 } from '../shaders/shaderBuilder';

export const PI = Math.acos( -1.0 );
export const INV_PI = 1.0 / PI;
export const HALF_PI = PI / 2.0;
export const TAU = 2.0 * PI;
export const INV_TAU = 1.0 / TAU;
export const GOLDEN_ANGLE = 2.3999632;
export const HALF_SQRT_TWO = Math.sqrt( 2.0 ) / 2.0;
export const DIELECTRIC_SPECULAR = vec3( 0.04 );
export const ONE_SUB_DIELECTRIC_SPECULAR = sub( 1.0, DIELECTRIC_SPECULAR );
export const ONE_POINT_FIVE_POW_I = [ ...new Array( 64 ) ].map( ( _, i ) => Math.pow( 0.5, i ) );
export const ONE_SUB_ONE_POINT_FIVE_POW_I = [ ...new Array( 64 ) ].map(
  ( _, i ) => 1.0 - Math.pow( 0.5, i )
);
