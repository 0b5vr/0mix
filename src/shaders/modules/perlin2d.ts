import { GLSLExpression, add, cache, cos, def, defFn, dot, floor, mix, mod, mul, retFn, sin, sub, sw, vec2, vec3 } from '../shaderBuilder';
import { TAU } from '../../utils/constants';
import { glslSmootherstep } from './glslSmootherstep';
import { pcg3df } from './pcg3df';

const symbol = Symbol();

export function perlin2d( v: GLSLExpression<'vec2'>, rep?: GLSLExpression<'vec2'> ): GLSLExpression<'float'> {
  const f = cache( symbol, () => defFn( 'float', [ 'vec2', 'vec2' ], ( v, rep ) => {
    const cell = floor( v );
    const cellCoord = def( 'vec2', sub( v, cell ) );
    const cellIndex = def( 'vec2', floor( cell ) );

    const cellCoordS = def( 'vec2', glslSmootherstep( 0.0, 1.0, cellCoord ) );

    const grad = ( off: GLSLExpression<'vec2'> ): GLSLExpression<'float'> => {
      const phi = mul( TAU, sw( pcg3df( vec3( mod( add( cellIndex, off ), rep ), 0.0 ) ), 'x' ) );
      return dot(
        vec2( cos( phi ), sin( phi ) ),
        sub( cellCoord, off ),
      );
    };

    retFn( mix(
      mix(
        grad( vec2( 0.0, 0.0 ) ),
        grad( vec2( 1.0, 0.0 ) ),
        sw( cellCoordS, 'x' ),
      ),
      mix(
        grad( vec2( 0.0, 1.0 ) ),
        grad( vec2( 1.0, 1.0 ) ),
        sw( cellCoordS, 'x' ),
      ),
      sw( cellCoordS, 'y' ),
    ) );
  } ) );

  return f( v, rep ?? vec2( 65536.0 ) );
}
