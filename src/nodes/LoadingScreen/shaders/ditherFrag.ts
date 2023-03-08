import { assign, build, defInNamed, defOut, glFragCoord, insert, main, sq, step, sub, sw, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { pcg3df } from '../../../shaders/modules/pcg3df';

export const ditherFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );
  const fragColor = defOut( 'vec4' );

  main( () => {
    const noise = sw( pcg3df( sw( glFragCoord, 'xyy' ) ), 'x' );
    const threshold = sq( sw( vUv, 'x' ) );
    const c = step( 0.0, sub( threshold, noise ) );
    assign( fragColor, vec4( vec3( c ), 1.0 ) );
  } );
} );
