import { assign, build, defInNamed, defOut, defUniformNamed, div, insert, main, normalize, sw, vec4 } from '../shaderBuilder';

export const deferredColorFrag = build( () => {
  insert( 'precision highp float;' );

  const vPosition = defInNamed( 'vec4', 'vPosition' );
  const vProjPosition = defInNamed( 'vec4', 'vProjPosition' );
  const vNormal = defInNamed( 'vec3', 'vNormal' );

  const fragColor = defOut( 'vec4' );
  const fragPosition = defOut( 'vec4', 1 );
  const fragNormal = defOut( 'vec4', 2 );
  const fragMisc = defOut( 'vec4', 3 );

  const color = defUniformNamed( 'vec4', 'color' );
  const mtlKind = defUniformNamed( 'float', 'mtlKind' );
  const mtlParams = defUniformNamed( 'vec4', 'mtlParams' );

  main( () => {
    const depth = div( sw( vProjPosition, 'z' ), sw( vProjPosition, 'w' ) );

    assign( fragColor, color );
    assign( fragPosition, vec4( sw( vPosition, 'xyz' ), depth ) );
    assign( fragNormal, vec4( normalize( vNormal ), mtlKind ) );
    assign( fragMisc, mtlParams );
    return;
  } );
} );
