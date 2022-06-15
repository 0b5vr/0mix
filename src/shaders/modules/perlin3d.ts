import { TAU } from '../../utils/constants';
import { add, cache, cos, def, defFn, dot, floor, GLSLExpression, mix, mod, mul, retFn, sin, sq, sqrt, sub, sw, vec3 } from '../shaderBuilder';
import { glslSmootherstep } from './glslSmootherstep';
import { pcg3df } from './pcg3df';

const symbol = Symbol();

export function perlin3d( v: GLSLExpression<'vec3'>, rep?: GLSLExpression<'vec3'> ): GLSLExpression<'float'> {
  const f = cache( symbol, () => defFn( 'float', [ 'vec3', 'vec3' ], ( v, rep ) => {
    const cell = floor( v );
    const cellCoord = def( 'vec3', sub( v, cell ) );
    const cellIndex = def( 'vec3', floor( cell ) );

    const cellCoordS = def( 'vec3', glslSmootherstep( 0.0, 1.0, cellCoord ) );

    const grad = ( off: GLSLExpression<'vec3'> ) => {
      const xi = def( 'vec2', sw( pcg3df( mod( add( cellIndex, off ), rep ) ), 'xy' ) );
      const phi = def( 'float', mul( TAU, sw( xi, 'x' ) ) );
      const cosTheta = def( 'float', sub( mul( 2.0, sw( xi, 'y' ) ), 1.0 ) );
      const sinTheta = def( 'float', sqrt( sub( 1.0, sq( cosTheta ) ) ) );
      const d = vec3(
        mul( sinTheta, cos( phi ) ),
        mul( sinTheta, sin( phi ) ),
        cosTheta,
      );

      return dot( d, sub( cellCoord, off ) );
    };

    retFn( mix(
      mix(
        mix(
          grad( vec3( 0.0, 0.0, 0.0 ) ),
          grad( vec3( 1.0, 0.0, 0.0 ) ),
          sw( cellCoordS, 'x' ),
        ),
        mix(
          grad( vec3( 0.0, 1.0, 0.0 ) ),
          grad( vec3( 1.0, 1.0, 0.0 ) ),
          sw( cellCoordS, 'x' ),
        ),
        sw( cellCoordS, 'y' ),
      ),
      mix(
        mix(
          grad( vec3( 0.0, 0.0, 1.0 ) ),
          grad( vec3( 1.0, 0.0, 1.0 ) ),
          sw( cellCoordS, 'x' ),
        ),
        mix(
          grad( vec3( 0.0, 1.0, 1.0 ) ),
          grad( vec3( 1.0, 1.0, 1.0 ) ),
          sw( cellCoordS, 'x' ),
        ),
        sw( cellCoordS, 'y' ),
      ),
      sw( cellCoordS, 'z' ),
    ) );
  } ) );

  return f( v, rep ?? vec3( 65536.0 ) );
}
