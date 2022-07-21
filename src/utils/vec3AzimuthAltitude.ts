import { RawVector3 } from '@0b5vr/experimental';

/**
 * Create a unit vector out of an azimuth and an altitude.
 *
 * If both values are zero, it returns `[1, 0, 0]` .
 * Azimuth represents an angle around Y axis.
 * Altitude represents an angle around Z axis.
 * It is rotated in intrinsic Y-Z order.
 *
 * @param azimuth The azimuth
 * @param altitude The altitude
 * @returns A vector created from the azimuth and the altitude
 */
export function vec3AzimuthAltitude( azimuth: number, altitude: number ): RawVector3 {
  return [
    Math.cos( altitude ) * Math.cos( azimuth ),
    Math.sin( altitude ),
    -Math.cos( altitude ) * Math.sin( azimuth ),
  ];
}
