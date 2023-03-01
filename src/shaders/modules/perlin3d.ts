import { GLSLExpression, add, cache, def, defFn, dot, floor, mix, mod, retFn, sub, sw, vec3 } from '../shaderBuilder';
import { glslSmootherstep } from './glslSmootherstep';
import { pcg3df } from './pcg3df';
import { uniformSphere } from './uniformSphere';

const symbol = Symbol();

export function perlin3d( v: GLSLExpression<'vec3'>, rep?: GLSLExpression<'vec3'> ): GLSLExpression<'float'> {
  const f = cache( symbol, () => defFn( 'float', [ 'vec3', 'vec3' ], ( v, rep ) => {
    const cell = floor( v );
    const cellCoord = def( 'vec3', sub( v, cell ) );
    const cellIndex = def( 'vec3', floor( cell ) );

    const cellCoordS = def( 'vec3', glslSmootherstep( 0.0, 1.0, cellCoord ) );

    const grad = ( off: GLSLExpression<'vec3'> ): GLSLExpression<'float'> => {
      const xi = def( 'vec2', sw( pcg3df( mod( add( cellIndex, off ), rep ) ), 'xy' ) );
      return dot( uniformSphere( xi ), sub( cellCoord, off ) );
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
