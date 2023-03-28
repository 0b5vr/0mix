import { GLSLExpression, add, assign, build, def, defFn, defInNamed, defOut, defUniformNamed, div, glFragDepth, insert, length, main, mix, mul, normalize, retFn, sub, subAssign, sw, texture, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { MTL_PBR_ROUGHNESS_METALLIC } from '../../CameraStack/deferredConstants';
import { calcNormal } from '../../../shaders/modules/calcNormal';
import { calcShadowDepth } from '../../../shaders/modules/calcShadowDepth';
import { glslDefRandom } from '../../../shaders/modules/glslDefRandom';
import { raymarch } from '../../../shaders/modules/raymarch';
import { setupRoRd } from '../../../shaders/modules/setupRoRd';
import { triplanarMapping } from '../../../shaders/modules/triplanarMapping';

export const moonFrag = ( tag: 'deferred' | 'depth' ): string => build( () => {
  insert( 'precision highp float;' );

  const vProjPosition = defInNamed( 'vec4', 'vProjPosition' );

  const pvm = defUniformNamed( 'mat4', 'pvm' );
  const modelMatrix = defUniformNamed( 'mat4', 'modelMatrix' );
  const normalMatrix = defUniformNamed( 'mat3', 'normalMatrix' );

  const fragColor = defOut( 'vec4' );
  const fragPosition = defOut( 'vec4', 1 );
  const fragNormal = defOut( 'vec4', 2 );
  const fragMisc = defOut( 'vec4', 3 );

  const time = defUniformNamed( 'float', 'time' );
  const sampler0 = defUniformNamed( 'sampler2D', 'sampler0' );

  const { init } = glslDefRandom();

  const fnTriplanar = ( p: GLSLExpression<'vec3'> ): GLSLExpression<'vec4'> => (
    triplanarMapping( p, normalize( p ), 5.0, ( uv ) => texture( sampler0, uv ) )
  );

  const map = defFn( 'vec4', [ 'vec3' ], ( p ) => {
    const d = def( 'float', sub( length( p ), 0.9 ) );
    subAssign( d, mul( 0.02, sw( fnTriplanar( p ), 'x' ) ) );

    retFn( vec4( d, 0, 0, 0 ) );
  } );

  main( () => {
    const p = def( 'vec2', div( sw( vProjPosition, 'xy' ), sw( vProjPosition, 'w' ) ) );
    init( vec4( p, time, 1.0 ) );

    const [ ro, rd ] = setupRoRd( p );

    const { rp } = raymarch( {
      iter: 20,
      ro,
      rd,
      map,
      marchMultiplier: 0.9,
      discardThreshold: 1E-2,
    } );

    const modelPos = def( 'vec4', mul( modelMatrix, vec4( rp, 1.0 ) ) );

    const projPos = def( 'vec4', mul( pvm, vec4( rp, 1.0 ) ) );
    const depth = div( sw( projPos, 'z' ), sw( projPos, 'w' ) );
    assign( glFragDepth, add( 0.5, mul( 0.5, depth ) ) );

    if ( tag === 'depth' ) {
      assign( fragColor, calcShadowDepth( projPos ) );
      retFn();

    }

    const N = def( 'vec3', calcNormal( { rp, map, delta: 1E-4 } ) );

    const col = mix( 0.3, 0.6, sw( fnTriplanar( rp ), 'x' ) );

    assign( fragColor, vec4( vec3( col ), 1.0 ) );
    assign( fragPosition, vec4( sw( modelPos, 'xyz' ), depth ) );
    assign( fragNormal, vec4( normalize( mul( normalMatrix, N ) ), MTL_PBR_ROUGHNESS_METALLIC ) );
    assign( fragMisc, vec4( 0.9, 0.0, 0.0, 0.0 ) );

  } );
} );
