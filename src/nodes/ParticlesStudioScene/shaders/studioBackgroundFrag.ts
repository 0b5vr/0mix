import { MTL_PBR_ROUGHNESS_METALLIC } from '../../CameraStack/deferredConstants';
import { add, assign, build, def, defFn, defOut, defUniformNamed, div, glFragCoord, glFragDepth, glslFalse, glslTrue, gt, insert, main, mul, normalize, retFn, sub, sw, tern, vec4 } from '../../../shaders/shaderBuilder';
import { calcNormal } from '../../../shaders/modules/calcNormal';
import { calcShadowDepth } from '../../../shaders/modules/calcShadowDepth';
import { raymarch } from '../../../shaders/modules/raymarch';
import { sdsellipse2 } from '../../../shaders/modules/sdsellipse2';
import { setupRoRd } from '../../../shaders/modules/setupRoRd';

export const studioBackgroundFrag = ( tag: 'deferred' | 'depth' ): string => build( () => {
  insert( 'precision highp float;' );

  const pvm = defUniformNamed( 'mat4', 'pvm' );
  const modelMatrix = defUniformNamed( 'mat4', 'modelMatrix' );
  const normalMatrix = defUniformNamed( 'mat3', 'normalMatrix' );

  const isAfterMarch = def( 'bool', glslFalse );

  const fragColor = defOut( 'vec4' );
  const fragPosition = defOut( 'vec4', 1 );
  const fragNormal = defOut( 'vec4', 2 );
  const fragMisc = defOut( 'vec4', 3 );

  const resolution = defUniformNamed( 'vec2', 'resolution' );

  const map = defFn( 'vec4', [ 'vec3' ], ( p ) => {
    assign( p, tern( gt( sw( p, 'z' ), sw( p, 'y' ) ), sw( p, 'xzy' ), p ) );

    const d = def( 'float', tern(
      gt( sw( p, 'y' ), 0.0 ),
      add( sw( p, 'z' ), 1.0 ),
      sub( 1.0, sdsellipse2( sw( p, 'yz' ), 4.0 ) ),
    ) );

    retFn( vec4( d, 0, 0, 0 ) );
  } );

  main( () => {
    const p = def( 'vec2', div(
      sub( mul( 2.0, sw( glFragCoord, 'xy' ) ), resolution ),
      sw( resolution, 'y' ),
    ) );

    const [ ro, rd ] = setupRoRd( p );

    const { rp } = raymarch( {
      iter: 20,
      ro,
      rd,
      map,
      marchMultiplier: 0.9,
      // discardThreshold: 1E-2, // too much artifacts, how bout no hit test
    } );

    const modelPos = def( 'vec4', mul( modelMatrix, vec4( rp, 1.0 ) ) );

    const projPos = def( 'vec4', mul( pvm, vec4( rp, 1.0 ) ) );
    const depth = div( sw( projPos, 'z' ), sw( projPos, 'w' ) );
    assign( glFragDepth, add( 0.5, mul( 0.5, depth ) ) );

    if ( tag === 'depth' ) {
      assign( fragColor, calcShadowDepth( projPos ) );
      retFn();

    }

    assign( isAfterMarch, glslTrue );

    const N = def( 'vec3', calcNormal( { rp, map, delta: 1E-4 } ) );

    assign( fragColor, vec4( 1.0 ) );
    assign( fragPosition, vec4( sw( modelPos, 'xyz' ), depth ) );
    assign( fragNormal, vec4( normalize( mul( normalMatrix, N ) ), MTL_PBR_ROUGHNESS_METALLIC ) );
    assign( fragMisc, vec4( 0.5, 0.0, 0.0, 0.0 ) );

  } );
} );
