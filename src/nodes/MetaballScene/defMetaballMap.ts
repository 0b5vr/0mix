import { GLSLExpression, add, assign, def, defFn, length, mad, mul, retFn, sin, sub, sw, unrollLoop, vec3, vec4 } from '../../shaders/shaderBuilder';
import { TAU } from '../../utils/constants';
import { pcg3df } from '../../shaders/modules/pcg3df';
import { smin } from '../../shaders/modules/smin';

export const defMetaballMap: {
  ( time: GLSLExpression<'float'> ): ( p: GLSLExpression<'vec3'> ) => GLSLExpression<'vec4'>;
} = ( time ) => {
  return defFn( 'vec4', [ 'vec3' ], ( p ) => {
    const pt = def( 'vec3', p );
    const d = def( 'float', sub( length( pt ), 0.1 ) );

    const off = def( 'vec3' );
    const radius = def( 'vec3' );

    unrollLoop( 7, ( i ) => {
      assign( off, sin( vec3( mad(
        add( 0.5, pcg3df( vec3( i + 20 ) ) ),
        time,
        mul( TAU, pcg3df( vec3( i ) ) ),
      ) ) ) );

      assign( radius, mad( 0.1, pcg3df( vec3( i + 40 ) ), 0.05 ) );

      assign( pt, mad( 0.2, off, p ) );
      assign( d, smin( d, sub( length( pt ), sw( radius, 'x' ) ), 0.15 ) );

      assign( pt, mad( -0.2, off, p ) );
      assign( d, smin( d, sub( length( pt ), sw( radius, 'y' ) ), 0.15 ) );
    } );

    retFn( vec4( d, 0, 0, 0 ) );
  } );
};
