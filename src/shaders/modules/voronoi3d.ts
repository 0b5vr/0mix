import { GLSLExpression, GLSLFloatExpression, add, assign, cache, def, defFn, floor, forLoop, ifThen, lt, num, retFn, sub, vec3, vec4 } from '../shaderBuilder';
import { minkowski3d } from './minkowski3d';
import { pcg3df } from './pcg3df';

const symbol = Symbol();

/**
 * @param v vector
 * @param p minzowsky p
 * @returns vec4( cellOrigin, len )
 */
export function voronoi3d(
  v: GLSLExpression<'vec3'>,
  p: GLSLFloatExpression = 2.0,
): GLSLExpression<'vec4'> {
  const f = cache( symbol, () => defFn( 'vec4', [ 'vec3', 'float' ], ( v, p ) => {
    const cell = def( 'vec3', floor( v ) );

    const nearestCell = def( 'vec3' );
    const nearestLen = def( 'float', 1E9 );

    forLoop( 3, ( iz ) => {
      forLoop( 3, ( iy ) => {
        forLoop( 3, ( ix ) => {
          const currentCell = add( cell, -1.0, vec3( ix, iy, iz ) );
          const cellOrigin = add(
            currentCell,
            pcg3df( currentCell ),
          );

          const len = def( 'float', minkowski3d( sub( cellOrigin, v ), p ) );

          ifThen( lt( len, nearestLen ), () => {
            assign( nearestCell, currentCell );
            assign( nearestLen, len );
          } );
        } );
      } );
    } );

    retFn( vec4( nearestCell, nearestLen ) );
  } ) );

  return f( v, num( p ) );
}
