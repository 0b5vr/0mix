import { add, addAssign, assign, build, def, defFn, defInNamed, defOut, defUniformArrayNamed, defUniformNamed, div, dot, glFragCoord, insert, main, max, mix, mul, normalize, pow, retFn, sq, sub, sw, texture, textureLod, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { calcAlbedoF0 } from '../../../shaders/modules/calcAlbedoF0';
import { calcL } from '../../../shaders/modules/calcL';
import { defDoSomethingUsingSamplerArray } from '../../../shaders/modules/defDoSomethingUsingSamplerArray';
import { doAnalyticLighting } from '../../../shaders/modules/doAnalyticLighting';
import { doShadowMapping } from '../../../shaders/modules/doShadowMapping';
import { forEachLights } from '../../../shaders/modules/forEachLights';

export const floorFrag = build( () => {
  insert( 'precision highp float;' );

  const vPosition = defInNamed( 'vec4', 'vPosition' );
  const vNormal = defInNamed( 'vec3', 'vNormal' );
  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const cameraPos = defUniformNamed( 'vec3', 'cameraPos' );
  const samplerRoughness = defUniformNamed( 'sampler2D', 'samplerRoughness' );
  const samplerMirror = defUniformNamed( 'sampler2D', 'samplerMirror' );
  const samplerShadow = defUniformArrayNamed( 'sampler2D', 'samplerShadow', 8 );

  const doSomethingUsingSamplerShadow = defDoSomethingUsingSamplerArray( samplerShadow, 8 );
  const fetchShadowMap = defFn( 'vec4', [ 'int', 'vec2' ], ( iLight, uv ) => {
    retFn( doSomethingUsingSamplerShadow(
      iLight,
      ( sampler ) => texture( sampler, uv )
    ) );
  } );

  main( () => {
    const posXYZ = sw( vPosition, 'xyz' );

    const screenUv = def( 'vec2', div( sw( glFragCoord, 'xy' ), resolution ) );
    assign( sw( screenUv, 'y' ), sub( 1.0, sw( screenUv, 'y' ) ) );

    const noise = def( 'float', sw( texture( samplerRoughness, vUv ), 'x' ) );

    const baseColor = def( 'vec3', vec3( 0.2 ) );
    const roughness = mix( 0.1, 0.2, noise );
    const metallic = 0.1;

    const lod = mix( 1.0, 5.0, noise ); // physically cringe rendering
    const tex = def( 'vec4', textureLod( samplerMirror, screenUv, lod ) );

    const V = normalize( sub( cameraPos, posXYZ ) );
    const dotVN = dot( V, vNormal );

    const FReflect = mix(
      0.08,
      1.0,
      pow( max( 0.0, sub( 1.0, dotVN ) ), 5.0 ),
    );
    const col = def( 'vec3', mul( sw( tex, 'xyz' ), FReflect ) );

    const { albedo, f0 } = calcAlbedoF0( baseColor, metallic );

    forEachLights( ( {
      iLight,
      lightPos,
      lightColor,
      lightPV,
      lightNearFar,
      lightParams,
    } ) => {
      const [ L, lenL ] = calcL( lightPos, posXYZ );

      const dotNL = def( 'float', max( dot( vNormal, L ), 0.0 ) );

      const lightCol = lightColor;
      const lightDecay = div( 1.0, sq( lenL ) );

      // fetch shadowmap + spot lighting
      const lightProj = mul( lightPV, vPosition );
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
        doAnalyticLighting( L, V, vNormal, roughness, albedo, f0 ),
      ) );

      addAssign( col, lightShaded );
    } );

    assign( fragColor, vec4( col, 1.0 ) );
  } );
} );
