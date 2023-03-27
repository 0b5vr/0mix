import { add, addAssign, assign, build, def, defFn, defInNamed, defOut, defUniformArrayNamed, defUniformNamed, div, divAssign, dot, eq, exp2, glFragDepth, ifThen, insert, mad, main, max, mul, mulAssign, normalize, retFn, sq, sub, subAssign, sw, texture, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { calcAlbedoF0 } from '../../../shaders/modules/calcAlbedoF0';
import { calcL } from '../../../shaders/modules/calcL';
import { calcNormal } from '../../../shaders/modules/calcNormal';
import { cyclicNoise } from '../../../shaders/modules/cyclicNoise';
import { defDoSomethingUsingSamplerArray } from '../../../shaders/modules/defDoSomethingUsingSamplerArray';
import { defIBL } from '../../../shaders/modules/defIBL';
import { doAnalyticLighting } from '../../../shaders/modules/doAnalyticLighting';
import { doShadowMapping } from '../../../shaders/modules/doShadowMapping';
import { forEachLights } from '../../../shaders/modules/forEachLights';
import { glslDefRandom } from '../../../shaders/modules/glslDefRandom';
import { glslLofir } from '../../../shaders/modules/glslLofir';
import { raymarch } from '../../../shaders/modules/raymarch';
import { rotate2D } from '../../../shaders/modules/rotate2D';
import { sdcapsule } from '../../../shaders/modules/sdcapsule';
import { setupRoRd } from '../../../shaders/modules/setupRoRd';

export const capsuleTransFrag = build( () => {
  insert( 'precision highp float;' );

  const vProjPosition = defInNamed( 'vec4', 'vProjPosition' );

  const pvm = defUniformNamed( 'mat4', 'pvm' );
  const modelMatrix = defUniformNamed( 'mat4', 'modelMatrix' );
  const normalMatrix = defUniformNamed( 'mat3', 'normalMatrix' );

  const fragColor = defOut( 'vec4' );

  const time = defUniformNamed( 'float', 'time' );

  const { init } = glslDefRandom();

  const cameraPos = defUniformNamed( 'vec3', 'cameraPos' );
  const samplerShadow = defUniformArrayNamed( 'sampler2D', 'samplerShadow', 8 );

  const doSomethingUsingSamplerShadow = defDoSomethingUsingSamplerArray( samplerShadow, 8 );
  const fetchShadowMap = defFn( 'vec4', [ 'int', 'vec2' ], ( iLight, uv ) => {
    retFn( doSomethingUsingSamplerShadow(
      iLight,
      ( sampler ) => texture( sampler, uv )
    ) );
  } );

  const isAfterMarch = def( 'float', 0.0 );
  const noise = def( 'vec3' );

  const map = defFn( 'vec4', [ 'vec3' ], ( p ) => {
    addAssign( sw( p, 'x' ), mul( 0.3, time ) );

    const cell = def( 'float', glslLofir( sw( p, 'x' ), 1.5 ) );
    subAssign( sw( p, 'x' ), cell );

    mulAssign( sw( p, 'zx' ), rotate2D( mad( 0.5, time, cell ) ) );
    mulAssign( sw( p, 'xy' ), rotate2D( 0.6 ) );
    addAssign( sw( p, 'y' ), 0.5 );
    const capsule = sdcapsule( p, vec3( 0.0, 1.0, 0.0 ) );

    const d = def( 'float', sub( capsule, 0.29 ) );

    ifThen( eq( isAfterMarch, 1.0 ), () => {
      assign( noise, cyclicNoise( mul( 10.0, p ), { warp: 0.8 } ) );
    } );

    retFn( vec4( d, 0, 0, 0 ) );
  } );

  const { diffuseIBL, specularIBL } = defIBL();

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

    assign( isAfterMarch, 1.0 );

    const opacity = 0.04;
    const { albedo, f0 } = calcAlbedoF0( vec3( 1.0 ), 0.0 );
    divAssign( f0, opacity );

    const modelPos = def( 'vec4', mul( modelMatrix, vec4( rp, 1.0 ) ) );
    const modelPosXYZ = sw( modelPos, 'xyz' );

    const projPos = def( 'vec4', mul( pvm, vec4( rp, 1.0 ) ) );
    const depth = div( sw( projPos, 'z' ), sw( projPos, 'w' ) );
    assign( glFragDepth, add( 0.5, mul( 0.5, depth ) ) );

    const N = def( 'vec3', calcNormal( { rp, map, delta: 1E-4 } ) );
    const modelN = normalize( mul( normalMatrix, N ) );

    const roughness = def( 'float', exp2( mad( 1.5, sw( noise, 'x' ), -1.5 ) ) );

    const V = normalize( sub( cameraPos, modelPosXYZ ) );

    const col = def( 'vec3', vec3( 0.0 ) );

    forEachLights( ( {
      iLight,
      lightPos,
      lightColor,
      lightPV,
      lightNearFar,
      lightParams,
    } ) => {
      const [ L, lenL ] = calcL( lightPos, modelPosXYZ );

      const dotNL = def( 'float', max( dot( modelN, L ), 0.0 ) );

      const lightCol = lightColor;
      const lightDecay = div( 1.0, sq( lenL ) );

      // fetch shadowmap + spot lighting
      const lightProj = mul( lightPV, modelPos );
      const lightP = div( sw( lightProj, 'xyz' ), sw( lightProj, 'w' ) );
      const shadow = doShadowMapping(
        fetchShadowMap( iLight, add( 0.5, mul( 0.5, sw( lightP, 'xy' ) ) ) ),
        lenL,
        dotNL,
        lightP,
        lightNearFar,
        lightParams,
      );
      const irradiance = def( 'vec3', mul( lightCol, dotNL, lightDecay, shadow ) );


      // lighting
      const lightShaded = def( 'vec3', mul(
        irradiance,
        doAnalyticLighting( L, V, modelN, roughness, albedo, f0 ),
      ) );

      addAssign( col, lightShaded );
    } );

    // diffuse ibl
    addAssign( col, mul( diffuseIBL( albedo, modelN ) ) );

    // reflective ibl
    addAssign( col, specularIBL( f0, modelN, V, roughness ) );

    assign( fragColor, vec4( col, opacity ) );

  } );
} );

