import { DIELECTRIC_SPECULAR, ONE_SUB_DIELECTRIC_SPECULAR, TAU } from '../../../utils/constants';
import { GLSLExpression, GLSLFloatExpression, abs, add, addAssign, assign, build, clamp, cos, def, defFn, defInNamed, defOut, defUniformArrayNamed, defUniformNamed, div, dot, eq, glFragDepth, gt, ifChain, ifThen, insert, length, main, max, mix, mul, mulAssign, normalize, num, pow, retFn, smoothstep, sq, step, sub, sw, texture, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { brdfSheen } from '../../../shaders/modules/brdfSheen';
import { calcAlbedoF0 } from '../../../shaders/modules/calcAlbedoF0';
import { calcL } from '../../../shaders/modules/calcL';
import { defDoSomethingUsingSamplerArray } from '../../../shaders/modules/defDoSomethingUsingSamplerArray';
import { defIBL } from '../../../shaders/modules/defIBL';
import { doAnalyticLighting } from '../../../shaders/modules/doAnalyticLighting';
import { doShadowMapping } from '../../../shaders/modules/doShadowMapping';
import { forEachLights } from '../../../shaders/modules/forEachLights';
import { glslSaturate } from '../../../shaders/modules/glslSaturate';

export const MTL_NONE = 0;

/**
 * no need to set params
 */
export const MTL_UNLIT = 1;

/**
 * vec4( roughness, metallic, emissive, reserved )
 */
export const MTL_PBR_ROUGHNESS_METALLIC = 2;

/**
 * vec4( emissiveRGB, roughness )
 * if roughness is negative, use full metallic
 */
export const MTL_PBR_EMISSIVE3_ROUGHNESS = 3;

/**
 * vec4( sheenTint, sheenRoughness )
 */
export const MTL_PBR_SHEEN = 4;

/**
 * vec4( roughness, metallic, mix, reserved )
 */
export const MTL_IRIDESCENT = 5;

const EPSILON = 1E-3;

export const deferredShadeFrag = ( { withAO }: {
  withAO: boolean;
} ): string => build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  const cameraPos = defUniformNamed( 'vec3', 'cameraPos' );
  const sampler0 = defUniformNamed( 'sampler2D', 'sampler0' ); // color.rgba
  const sampler1 = defUniformNamed( 'sampler2D', 'sampler1' ); // position.xyz, depth
  const sampler2 = defUniformNamed( 'sampler2D', 'sampler2' ); // normal.xyz
  const sampler3 = defUniformNamed( 'sampler2D', 'sampler3' ); // materialParams.xyz, materialId
  const samplerShadow = defUniformArrayNamed( 'sampler2D', 'samplerShadow', 8 );
  const samplerAo = defUniformNamed( 'sampler2D', 'samplerAo' );

  const { diffuseIBL, specularIBL } = defIBL();

  const doSomethingUsingSamplerShadow = defDoSomethingUsingSamplerArray( samplerShadow, 8 );
  const fetchShadowMap = defFn( 'vec4', [ 'int', 'vec2' ], ( iLight, uv ) => {
    retFn( doSomethingUsingSamplerShadow(
      iLight,
      ( sampler ) => texture( sampler, uv )
    ) );
  } );

  main( () => {
    const tex0 = texture( sampler0, vUv );
    const tex1 = texture( sampler1, vUv );
    const tex2 = texture( sampler2, vUv );
    const tex3 = texture( sampler3, vUv );

    const color = sw( tex0, 'xyz' );
    const position = sw( tex1, 'xyz' );
    const normal = sw( tex2, 'xyz' );
    const depth = sw( tex1, 'w' );
    const mtlId = sw( tex2, 'w' );

    const V = def( 'vec3', normalize( sub( cameraPos, position ) ) );

    const dotNV = clamp( dot( normal, V ), EPSILON, 1.0 );

    const outColor = def( 'vec3', vec3( 0.0 ) );

    const ao = withAO ? def( 'float', sw( texture( samplerAo, vUv ), 'x' ) ) : 1.0;

    const shadePBR = (
      roughness: GLSLFloatExpression,
      metallic: GLSLFloatExpression,
    ): GLSLExpression<'vec3'> => {
      // begin lighting
      const shaded = def( 'vec3', vec3( 0.0 ) );

      forEachLights( ( { iLight, lightPos, lightColor, lightNearFar, lightParams, lightPV } ) => {
        const [ L, lenL ] = calcL( lightPos, position );

        const dotNL = max( dot( normal, L ), 1E-3 );

        const { albedo, f0 } = calcAlbedoF0( color, metallic );

        ifThen( eq( mtlId, MTL_IRIDESCENT ), () => {
          const iri = def( 'vec3', add( // cringe
            vec3( 0.5, 0.6, 1.0 ),
            mul( vec3( 0.4, 0.4, 0.6 ), cos( mul(
              TAU,
              add(
                vec3( 0.0, 0.0, 0.25 ),
                mul( vec3( 0.43, 0.73, 0.25 ), pow( dotNV, 0.7 ) ),
              ),
            ) ) ),
          ) );
          assign( f0, mix( f0, sq( glslSaturate( iri ) ), sw( tex3, 'z' ) ) );
        } );

        const irradiance = mul(
          lightColor,
          div( 1.0, sq( lenL ) ),
          dotNL,
        );

        // shading
        const lightShaded = def( 'vec3', mul(
          irradiance,
          doAnalyticLighting( V, L, normal, roughness, albedo, f0 ),
          ao, // cringe
        ) );

        // sheen
        ifThen( eq( mtlId, MTL_PBR_SHEEN ), () => {
          const sheenTint = sw( tex3, 'xyz' );
          const sheenRoughness = sw( tex3, 'w' );

          addAssign( lightShaded, mul(
            irradiance,
            brdfSheen( L, V, normal, sheenRoughness, sheenTint ),
            ao, // cringe
          ) );
        } );

        // fetch shadowmap + spot lighting
        const lightProj = def( 'vec4', mul( lightPV, vec4( position, 1.0 ) ) );
        const lightP = def( 'vec3', div( sw( lightProj, 'xyz' ), sw( lightProj, 'w' ) ) );

        mulAssign(
          lightShaded,
          doShadowMapping(
            fetchShadowMap( iLight, add( 0.5, mul( 0.5, sw( lightP, 'xy' ) ) ) ),
            lenL,
            dotNL,
            lightP,
            lightNearFar,
            lightParams,
          ),
        );

        addAssign( shaded, lightShaded );
      } );

      const iblAmp = def( 'float', smoothstep(
        3.0,
        2.0,
        length( sub( position, vec3( 0.0, 3.0, 0.0 ) ) ),
      ) );
      ifThen( gt( iblAmp, 0.0 ), () => {
        // diffuse ibl
        const albedo = mix( mul( color, ONE_SUB_DIELECTRIC_SPECULAR ), vec3( 0.0 ), metallic );
        const f0 = mix( DIELECTRIC_SPECULAR, color, metallic );

        addAssign( shaded, mul( iblAmp, ao, diffuseIBL( albedo, normal ) ) );

        // // reflective ibl
        addAssign( shaded, mul(
          iblAmp,
          specularIBL( f0, normal, V, num( roughness ) ),
        ) );
      } );

      return shaded;
    };

    ifChain(
      [ eq( mtlId, MTL_NONE ), () => {
        // do nothing
      } ],
      [ eq( mtlId, MTL_UNLIT ), () => {
        assign( outColor, color );
      } ],
      [ eq( mtlId, MTL_PBR_ROUGHNESS_METALLIC ), () => {
        assign( outColor, shadePBR( sw( tex3, 'x' ), sw( tex3, 'y' ) ) );
        addAssign( outColor, mul( sw( tex3, 'z' ), dotNV, color ) );
      } ],
      [ eq( mtlId, MTL_PBR_EMISSIVE3_ROUGHNESS ), () => {
        assign( outColor, shadePBR( abs( sw( tex3, 'w' ) ), step( sw( tex3, 'w' ), 0.0 ) ) );
        addAssign( outColor, sw( tex3, 'xyz' ) );
      } ],
      [ eq( mtlId, MTL_PBR_SHEEN ), () => {
        assign( outColor, shadePBR( 1.0, 0.0 ) );
      } ],
      [ eq( mtlId, MTL_IRIDESCENT ), () => {
        assign( outColor, shadePBR( sw( tex3, 'x' ), sw( tex3, 'y' ) ) );
      } ],
    );

    assign( fragColor, vec4( clamp( outColor, 0.0, 1E3 ), 1.0 ) );

    assign( glFragDepth, add( 0.5, mul( 0.5, depth ) ) );
  } );
} );
