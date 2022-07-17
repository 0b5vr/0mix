/* !
 * voronoi2dBorder
 *
 * The idea is stolen from iq
 * (c) 2013 Inigo Quilez, The MIT License
 *
 * Ref: https://www.iquilezles.org/www/articles/voronoilines/voronoilines.htm
 * Ref: https://www.shadertoy.com/view/ldl3W8
 */

import { GLSLExpression, add, and, assign, cache, def, defConst, defFn, dot, eq, forLoop, ifThen, int, lt, mul, normalize, not, retFn, sub, sw, vec3, vec4 } from '../shaderBuilder';
import { pcg3df } from './pcg3df';

const symbol = Symbol();

/**
 * @param v vector
 * @param result voronoi result retrieved by voronoi3d
 * @returns vec4( cellOrigin, len )
 */
export function voronoi3dBorder(
  v: GLSLExpression<'vec3'>,
  result: GLSLExpression<'vec4'>,
): GLSLExpression<'vec4'> {
  const f = cache(
    symbol,
    () => defFn( 'vec4', [ 'vec3', 'vec4' ], ( v, result ) => {
      const nearestCell = sw( result, 'xyz' );
      const nearestCellOrigin = def( 'vec3', add(
        nearestCell,
        pcg3df( nearestCell ),
      ) );

      const nearestCell2 = def( 'vec3' );
      const nearestLen2 = def( 'float', 1E9 );
      const intTwo = defConst( 'int', int( 2 ) );

      forLoop( 5, ( iz ) => {
        forLoop( 5, ( iy ) => {
          forLoop( 5, ( ix ) => {
            ifThen( not( and( eq( ix, intTwo ), eq( iy, intTwo ), eq( iz, intTwo ) ) ), () => {
              const currentCell = add( nearestCell, -2.0, vec3( ix, iy, iz ) );
              const cellOrigin = add(
                currentCell,
                pcg3df( currentCell ),
              );
              const diff = def( 'vec3', sub( cellOrigin, nearestCellOrigin ) );

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
      } );

      retFn( vec4( nearestCell2, nearestLen2 ) );
    } )
  );

  return f( v, result );
}
