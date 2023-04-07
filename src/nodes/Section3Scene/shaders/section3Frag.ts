import { GLSLExpression, abs, add, addAssign, assign, build, def, defInNamed, defOut, defUniformNamed, discard, div, gt, ifThen, insert, main, mix, mul, normalize, retFn, step, sub, sw, texture, vec2, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { MTL_PBR_ROUGHNESS_METALLIC } from '../../CameraStack/deferredConstants';
import { calcShadowDepth } from '../../../shaders/modules/calcShadowDepth';
import { sdbox2 } from '../../../shaders/modules/sdbox2';

export const section3Frag = ( tag: 'deferred' | 'depth' ): string => build( () => {
  insert( 'precision highp float;' );

  const vPosition = defInNamed( 'vec4', 'vPosition' );
  const vProjPosition = defInNamed( 'vec4', 'vProjPosition' );
  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );
  const fragPosition = defOut( 'vec4', 1 );
  const fragNormal = defOut( 'vec4', 2 );
  const fragMisc = defOut( 'vec4', 3 );

  const sampler0 = defUniformNamed( 'sampler2D', 'sampler0' );
  const sampler1 = defUniformNamed( 'sampler2D', 'sampler1' );

  main( () => {
    const depth = div( sw( vProjPosition, 'z' ), sw( vProjPosition, 'w' ) );

    const rrect = def( 'float', sub( sdbox2( sub( vUv, 0.5 ), vec2( 0.47, 0.3 ) ), 0.03 ) );
    ifThen( gt( rrect, 0.0 ), () => discard() );

    if ( tag === 'depth' ) {
      assign( fragColor, calcShadowDepth( vProjPosition ) );
      retFn();

    }

    const uv = def( 'vec2', mix( vec2( 0.0, -0.5 ), vec2( 1.0, 1.5 ), vUv ) );
    const col = def( 'float', sw( texture( sampler0, uv ), 'w' ) );

    const h = ( uv: GLSLExpression<'vec2'> ): GLSLExpression<'float'> => add(
      mul( -0.2, sw( texture( sampler0, uv ), 'w' ) ),
      mul( 0.02, sw( texture( sampler1, uv ), 'w' ) ),
    );

    const n = normalize( vec3(
      sub( h( add( uv, vec2( 0.002, 0.0 ) ) ), h( add( uv, vec2( -0.002, 0.0 ) ) ) ),
      sub( h( add( uv, vec2( 0.0, 0.004 ) ) ), h( add( uv, vec2( 0.0, -0.004 ) ) ) ),
      1.0,
    ) );

    addAssign( col, step( abs( add( rrect, 0.01 ) ), 0.002 ) );

    assign( fragColor, vec4( vec3( mix( 0.07, 0.8, col ) ), 1.0 ) );
    assign( fragPosition, vec4( sw( vPosition, 'xyz' ), depth ) );
    assign( fragNormal, vec4( n, MTL_PBR_ROUGHNESS_METALLIC ) );
    assign( fragMisc, vec4( 0.1, 0.0, 0.0, 1.0 ) );
    return;
  } );
} );
