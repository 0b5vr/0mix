import { add, addAssign, assign, build, def, defFn, defInNamed, defOut, defUniformArrayNamed, discard, div, glPointCoord, ifThen, insert, length, lt, main, max, mul, mulAssign, num, retFn, sq, sub, sw, texture, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { calcL } from '../../../shaders/modules/calcL';
import { defDoSomethingUsingSamplerArray } from '../../../shaders/modules/defDoSomethingUsingSamplerArray';
import { doShadowMapping } from '../../../shaders/modules/doShadowMapping';
import { forEachLights } from '../../../shaders/modules/forEachLights';

export const dustRenderFrag = build( () => {
  insert( 'precision highp float;' );

  const vPosition = defInNamed( 'vec4', 'vPosition' );

  const fragColor = defOut( 'vec4' );

  const samplerShadow = defUniformArrayNamed( 'sampler2D', 'samplerShadow', 8 );

  const doSomethingUsingSamplerShadow = defDoSomethingUsingSamplerArray( samplerShadow, 8 );
  const fetchShadowMap = defFn( 'vec4', [ 'int', 'vec2' ], ( iLight, uv ) => {
    retFn( doSomethingUsingSamplerShadow(
      iLight,
      ( sampler ) => texture( sampler, uv )
    ) );
  } );

  main( () => {
    ifThen( lt( 0.5, length( sub( glPointCoord, 0.5 ) ) ), () => discard() );

    const position = sw( vPosition, 'xyz' );

    const accum = def( 'vec3', vec3( 0.0 ) );

    forEachLights( ( { iLight, lightPos, lightColor, lightNearFar, lightPV, lightParams } ) => {
      const [ _L, lenL ] = calcL( lightPos, position );
      assign( lenL, max( 1.0, lenL ) );

      const irradiance = def( 'vec3', mul(
        lightColor,
        div( 1.0, sq( lenL ) ),
      ) );

      // fetch shadowmap + spot lighting
      const lightProj = def( 'vec4', mul( lightPV, vec4( position, 1.0 ) ) );
      const lightP = def( 'vec3', div( sw( lightProj, 'xyz' ), sw( lightProj, 'w' ) ) );

      mulAssign(
        irradiance,
        doShadowMapping(
          fetchShadowMap( iLight, add( 0.5, mul( 0.5, sw( lightP, 'xy' ) ) ) ),
          lenL,
          num( 1.0 ),
          lightP,
          lightNearFar,
          lightParams,
        ),
      );

      // ok
      addAssign( accum, irradiance );
    } );

    assign( fragColor, vec4( vec3( mul(
      0.1,
      accum,
    ) ), 1.0 ) );

  } );
} );
