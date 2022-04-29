/*!
 * voronoi2dBorder
 *
 * The idea is stolen from iq
 * (c) 2013 Inigo Quilez, The MIT License
 *
 * Ref: https://www.iquilezles.org/www/articles/voronoilines/voronoilines.htm
 * Ref: https://www.shadertoy.com/view/ldl3W8
 */

import { GLSLExpression, add, and, assign, cache, def, defConst, defFn, dot, eq, forLoop, ifThen, int, lt, mul, normalize, not, retFn, sub, sw, vec2, vec3 } from '../shaderBuilder';
import { pcg2df } from './pcg2df';

const symbol = Symbol();

/**
 * @param v vector
 * @param result voronoi result retrieved by voronoi2d
 * @returns vec3( cellOrigin, len )
 */
export function voronoi2dBorder(
  v: GLSLExpression<'vec2'>,
  result: GLSLExpression<'vec3'>,
): GLSLExpression<'vec3'> {
  const f = cache(
    symbol,
    () => defFn( 'vec3', [ 'vec2', 'vec3' ], ( v, result ) => {
      const nearestCell = sw( result, 'xy' );
      const nearestCellOrigin = def( 'vec2', add(
        nearestCell,
        pcg2df( nearestCell ),
      ) );

      const nearestCell2 = def( 'vec2' );
      const nearestLen2 = def( 'float', 1E9 );
      const intTwo = defConst( 'int', int( 2 ) );

      forLoop( 5, ( iy ) => {
        forLoop( 5, ( ix ) => {
          ifThen( not( and( eq( ix, intTwo ), eq( iy, intTwo ) ) ), () => {
            const currentCell = add( nearestCell, -2.0, vec2( ix, iy ) );
            const cellOrigin = add(
              currentCell,
              pcg2df( currentCell ),
            );
            const diff = def( 'vec2', sub( cellOrigin, nearestCellOrigin ) );

            const len = def( 'float', dot(
              sub( mul( 0.5, add( nearestCellOrigin, cellOrigin ) ), v ),
              normalize( diff ),
            ) );

            ifThen( lt( len, nearestLen2 ), () => {
              assign( nearestCell2, currentCell );
              assign( nearestLen2, len );
            } );
          } );
        } );
      } );

      retFn( vec3( nearestCell2, nearestLen2 ) );
    } )
  );

  return f( v, result );
}
