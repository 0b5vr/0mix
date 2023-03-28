import { GLSLExpression, add, assign, build, defInNamed, defOut, defUniformNamed, div, insert, main, mul, normalize, sub, sw, texture, vec2, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { MTL_PBR_ROUGHNESS_METALLIC } from '../../CameraStack/deferredConstants';

export const deskFrag = build( () => {
  insert( 'precision highp float;' );

  const vPosition = defInNamed( 'vec4', 'vPosition' );
  const vProjPosition = defInNamed( 'vec4', 'vProjPosition' );
  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );
  const fragPosition = defOut( 'vec4', 1 );
  const fragNormal = defOut( 'vec4', 2 );
  const fragMisc = defOut( 'vec4', 3 );

  const sampler0 = defUniformNamed( 'sampler2D', 'sampler0' );

  main( () => {
    const depth = div( sw( vProjPosition, 'z' ), sw( vProjPosition, 'w' ) );

    const tap = ( uv: GLSLExpression<'vec2'> ): GLSLExpression<'float'> => (
      sw( texture( sampler0, mul( 70.0, uv ) ), 'z' )
    );

    const n = normalize( vec3(
      sub( tap( add( vUv, vec2( 0.00005, 0.0 ) ) ), tap( add( vUv, vec2( -0.00005, 0.0 ) ) ) ),
      1.0,
      sub( tap( add( vUv, vec2( 0.0, 0.00005 ) ) ), tap( add( vUv, vec2( 0.0, -0.00005 ) ) ) ),
    ) );

    assign( fragColor, vec4( 0.02, 0.02, 0.02, 1.0 ) );

    assign( fragPosition, vec4( sw( vPosition, 'xyz' ), depth ) );
    assign( fragNormal, vec4( n, MTL_PBR_ROUGHNESS_METALLIC ) );
    assign( fragMisc, vec4( 0.2, 0.0, 0.0, 1.0 ) );
    return;
  } );
} );
