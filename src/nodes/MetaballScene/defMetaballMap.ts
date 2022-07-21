import { GLSLExpression, add, assign, def, defFn, length, mad, mul, retFn, sin, sub, unrollLoop, vec3, vec4 } from '../../shaders/shaderBuilder';
import { TAU } from '../../utils/constants';
import { pcg3df } from '../../shaders/modules/pcg3df';
import { smin } from '../../shaders/modules/smin';

export const defMetaballMap: {
  ( time: GLSLExpression<'float'> ): ( p: GLSLExpression<'vec3'> ) => GLSLExpression<'vec4'>;
} = ( time ) => {
  return defFn( 'vec4', [ 'vec3' ], ( p ) => {
    const pt = def( 'vec3', p );
    const d = def( 'float', length( pt ) );

    const off = def( 'vec3' );
    unrollLoop( 7, ( i ) => {
      assign( off, sin( vec3( mad(
        mul( TAU, pcg3df( vec3( i ) ) ),
        add( 0.5, pcg3df( vec3( 20 + i ) ) ),
        time,
      ) ) ) );

      assign( pt, mad( p, off, 0.2 ) );
      assign( d, smin( d, length( pt ), 0.15 ) );

      assign( pt, mad( p, off, -0.2 ) );
      assign( d, smin( d, length( pt ), 0.15 ) );
    } );

    retFn( vec4( sub( d, 0.15 ), 0, 0, 0 ) );
  } );
};
