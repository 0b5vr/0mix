import { add, assign, build, def, defInNamed, defOutNamed, defUniformNamed, discard, ifThen, insert, lt, main, max, mul, mulAssign, sin, sub, sw, texture, vec2, vec4 } from '../../../shaders/shaderBuilder';
import { calcShadowDepth } from '../../../shaders/modules/calcShadowDepth';
import { glslLinearstep } from '../../../shaders/modules/glslLinearstep';
import { sdcapsule } from '../../../shaders/modules/sdcapsule';

export const fuiFrag = ( tag: 'forward' | 'depth' ): string => build( () => {
  insert( 'precision highp float;' );

  const vProjPosition = defInNamed( 'vec4', 'vProjPosition' );
  const vUv = defInNamed( 'vec2', 'vUv' );
  const fragColor = defOutNamed( 'vec4', 'fragColor' );

  const time = defUniformNamed( 'float', 'time' );
  const opacity = defUniformNamed( 'float', 'opacity' );
  const samplerChar = defUniformNamed( 'sampler2D', 'samplerChar' );

  main( () => {
    const p = def( 'vec2', sub( mul( vUv, 2.0 ), 1.0 ) );

    const haha = def( 'float', 0.0 );

    // dotted line
    assign( haha, max( haha, mul(
      glslLinearstep( 0.005, 0.003, sdcapsule( sub( p, vec2( -1.0, -0.97 ) ), vec2( 2.0, 0.0 ) ) ),
      glslLinearstep( -0.5, -0.4, sin( mul( 100.0, add( sw( p, 'x' ), mul( 0.1, time ) ) ) ) ),
    ) ) );

    // chars
    const tex = texture( samplerChar, vUv );
    assign( haha, max( haha, sw( tex, 'x' ) ) );

    // opacity
    mulAssign( haha, opacity );

    if ( tag === 'forward' ) {
      ifThen( lt( haha, 0.1 ), () => discard() );

      assign( fragColor, vec4( haha ) );

    } else if ( tag === 'depth' ) {
      ifThen( lt( haha, 0.5 ), () => discard() );

      assign( fragColor, calcShadowDepth( vProjPosition ) );
      return;

    }
  } );
} );
