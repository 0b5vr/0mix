import { MTL_PBR_ROUGHNESS_METALLIC } from '../../CameraStack/deferredConstants';
import { abs, add, addAssign, assign, build, clamp, def, defFn, defInNamed, defOut, defUniformNamed, div, dot, eq, forLoop, glFragDepth, ifChain, ifThen, insert, length, lt, mad, main, max, min, mix, mul, mulAssign, neg, normalize, retFn, sign, smoothstep, step, sub, subAssign, sw, texture, vec2, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { calcNormal } from '../../../shaders/modules/calcNormal';
import { calcShadowDepth } from '../../../shaders/modules/calcShadowDepth';
import { cyclicNoise } from '../../../shaders/modules/cyclicNoise';
import { glslDefRandom } from '../../../shaders/modules/glslDefRandom';
import { glslLofir } from '../../../shaders/modules/glslLofir';
import { pcg3df } from '../../../shaders/modules/pcg3df';
import { raymarch } from '../../../shaders/modules/raymarch';
import { rotate2D } from '../../../shaders/modules/rotate2D';
import { sdbox } from '../../../shaders/modules/sdbox';
import { sdcapsule } from '../../../shaders/modules/sdcapsule';
import { setupRoRd } from '../../../shaders/modules/setupRoRd';
import { smax } from '../../../shaders/modules/smax';

export const capsuleFrag = ( tag: 'deferred' | 'depth' ): string => build( () => {
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

  const mtl = def( 'float', 0 );
  const label = def( 'float', 1.0 );
  const isAfterMarch = def( 'float', 0.0 );

  const map = defFn( 'vec4', [ 'vec3' ], ( p ) => {
    const r = mix( 0.31, 0.3, smoothstep( 0.8, 0.9, sw( p, 'y' ) ) );

    addAssign( sw( p, 'x' ), mul( 0.3, time ) );

    const cell = def( 'float', glslLofir( sw( p, 'x' ), 1.5 ) );
    subAssign( sw( p, 'x' ), cell );

    mulAssign( sw( p, 'zx' ), rotate2D( mad( 0.5, time, cell ) ) );
    mulAssign( sw( p, 'xy' ), rotate2D( 0.6 ) );
    addAssign( sw( p, 'y' ), 0.5 );
    const capsule = sdcapsule( p, vec3( 0.0, 1.0, 0.0 ) );
    const capsulein = sdcapsule( p, vec3( 0.0, 0.9, 0.0 ) );

    const d = def( 'float', sub( capsule, r ) );
    assign( d, max( d, sub( r, 0.02, capsulein ) ) );
    assign( d, smax( d, sub( 0.47, sw( p, 'y' ) ), 0.02 ) ); // cut

    ifThen( eq( isAfterMarch, 1.0 ), () => {
      addAssign( d, add(
        sw( mul(
          sub( 1.0, mtl ),
          0.001,
          smoothstep( 0.3, 1.0, cyclicNoise( mul( 2.0, p ), { warp: 1.8 } ) ),
        ), 'x' ),
        sw( mul(
          sub( 1.0, mtl ),
          0.001,
          cyclicNoise( mul( 4.0, p ), { warp: 0.8 } ),
        ), 'x' ),
      ) );
    } );

    assign( label, 1.0 );
    subAssign( label, mul(
      step( abs( mul( 1.5, sw( p, 'x' ) ) ), sub( sw( p, 'y' ), 0.55 ) ),
      step( sw( p, 'y' ), 0.6 ),
      step( 0.29, capsule ), // front face
    ) );

    const uv = def( 'vec2', add( sw( p, 'yx' ), vec2( -0.9, 0.0 ) ) );
    mulAssign( sw( uv, 'y' ), sign( sw( p, 'z' ) ) );
    addAssign( uv, 0.5 );

    subAssign( label, mul(
      sw( texture( sampler0, uv ), 'w' ),
      step( 0.29, capsule ), // front face
    ) );

    mulAssign( sw( p, 'yz' ), rotate2D( mul( 0.3, time ) ) );
    mulAssign( sw( p, 'zx' ), rotate2D( mul( 0.4, time ) ) );

    // inside the capsule, mandelbox
    const mandelboxScale = mad( 0.2, 1.0, sw( pcg3df( vec3( cell ) ), 'x' ) );
    const pt = def( 'vec3', mul( p, mandelboxScale ) );
    const s = def( 'float', 1.0 );

    forLoop( 10, () => {
      // box fold
      assign( pt, mad( 2.0, clamp( pt, -1.0, 1.0 ), neg( pt ) ) );

      // sphere fold
      const r2 = dot( pt, pt );
      ifChain(
        [ lt( r2, 0.5 ), () => {
          mulAssign( pt, 2.0 );
          mulAssign( s, 2.0 );
        } ],
        [ lt( r2, 1.0 ), () => {
          mulAssign( pt, div( 1.0, r2 ) );
          mulAssign( s, div( 1.0, r2 ) );
        } ],
      );

      // translate
      assign( pt, mad( -3.1, pt, p ) );
      assign( s, mad( 3.1, s, 1.0 ) );
    } );

    const d2 = def( 'float', max(
      div( length( pt ), abs( s ), mandelboxScale, 3.0 ),
      sdbox( p, vec3( 0.14 ) ),
    ) );
    assign( mtl, step( d2, d ) );
    assign( d, min( d, d2 ) );

    retFn( vec4( d, mtl, 0, 0 ) );
  } );

  main( () => {
    const p = def( 'vec2', div( sw( vProjPosition, 'xy' ), sw( vProjPosition, 'w' ) ) );
    init( vec4( p, time, 1.0 ) );

    const [ ro, rd ] = setupRoRd( p );

    const { rp } = raymarch( {
      iter: 40,
      ro,
      rd,
      map,
      marchMultiplier: 0.9,
      discardThreshold: 1E-2,
    } );

    assign( isAfterMarch, 1.0 );

    const modelPos = def( 'vec4', mul( modelMatrix, vec4( rp, 1.0 ) ) );

    const projPos = def( 'vec4', mul( pvm, vec4( rp, 1.0 ) ) );
    const depth = div( sw( projPos, 'z' ), sw( projPos, 'w' ) );
    assign( glFragDepth, add( 0.5, mul( 0.5, depth ) ) );

    if ( tag === 'depth' ) {
      assign( fragColor, calcShadowDepth( projPos ) );
      retFn();

    }

    const color = def( 'vec4', mix(
      vec4( vec3( mix( 0.04, 0.8, label ) ), 1.0 ),
      vec4( 0.2, 0.2, 0.2, 0.0 ),
      mtl,
    ) );

    const misc = def( 'vec4', mix(
      vec4( 0.2, 1.0, 0.0, 1.0 ),
      vec4( 0.4, 1.0, 0.0, 1.0 ),
      mtl,
    ) );

    const N = def( 'vec3', calcNormal( { rp, map, delta: mix( 1E-3, 1E-2, mtl ) } ) );

    assign( fragColor, color );
    assign( fragPosition, vec4( sw( modelPos, 'xyz' ), depth ) );
    assign( fragNormal, vec4( normalize( mul( normalMatrix, N ) ), MTL_PBR_ROUGHNESS_METALLIC ) );
    assign( fragMisc, misc );

  } );
} );
