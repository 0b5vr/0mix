import { assign, build, defInNamed, defOut, defUniformNamed, div, insert, main, sw, texture, vec4 } from '../shaderBuilder';

export const deferredTextureFrag = build( () => {
  insert( 'precision highp float;' );

  const vPosition = defInNamed( 'vec4', 'vPosition' );
  const vProjPosition = defInNamed( 'vec4', 'vProjPosition' );
  const vNormal = defInNamed( 'vec3', 'vNormal' );
  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );
  const fragPosition = defOut( 'vec4', 1 );
  const fragNormal = defOut( 'vec4', 2 );
  const fragMisc = defOut( 'vec4', 3 );

  const mtlKind = defUniformNamed( 'float', 'mtlKind' );
  const mtlParams = defUniformNamed( 'vec4', 'mtlParams' );
  const sampler0 = defUniformNamed( 'sampler2D', 'sampler0' );

  main( () => {
    const depth = div( sw( vProjPosition, 'z' ), sw( vProjPosition, 'w' ) );

    assign( fragColor, texture( sampler0, vUv ) );
    assign( fragPosition, vec4( sw( vPosition, 'xyz' ), depth ) );
    assign( fragNormal, vec4( vNormal, mtlKind ) );
    assign( fragMisc, mtlParams );
    return;
  } );
} );
