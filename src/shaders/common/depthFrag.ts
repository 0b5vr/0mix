import { assign, build, defInNamed, defOut, insert, main } from '../shaderBuilder';
import { calcShadowDepth } from '../modules/calcShadowDepth';

export const depthFrag = build( () => {
  insert( 'precision highp float;' );

  const vProjPosition = defInNamed( 'vec4', 'vProjPosition' );

  const fragColor = defOut( 'vec4' );

  main( () => {
    assign( fragColor, calcShadowDepth( vProjPosition ) );
  } );
} );
