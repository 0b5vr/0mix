import { GLSLExpression, abs, add, addAssign, assign, build, def, defFn, defInNamed, defOut, defUniformNamed, div, eq, forBreak, forLoop, glFragCoord, gt, ifThen, insert, length, lt, mad, main, mix, mul, mulAssign, retFn, smoothstep, sq, step, sub, sw, texture, vec4 } from '../../../shaders/shaderBuilder';
import { GRID_RESO } from '../constants';
import { boxMuller } from '../../../shaders/modules/boxMuller';
import { calcL } from '../../../shaders/modules/calcL';
import { defFluidSampleLinear3D } from './defFluidSampleLinear3D';
import { forEachLights } from '../../../shaders/modules/forEachLights';
import { glslDefRandom } from '../../../shaders/modules/glslDefRandom';
import { glslSaturate } from '../../../shaders/modules/glslSaturate';
import { maxOfVec3 } from '../../../shaders/modules/maxOfVec3';
import { randomSphere } from '../../../shaders/modules/randomSphere';
import { setupRoRd } from '../../../shaders/modules/setupRoRd';

export const fluidRenderFrag: string = build( () => {
  insert( 'precision highp float;' );

  const vProjPosition = defInNamed( 'vec4', 'vProjPosition' );
  const vPositionWithoutModel = defInNamed( 'vec4', 'vPositionWithoutModel' );

  const fragColor = defOut( 'vec4' );

  const time = defUniformNamed( 'float', 'time' );
  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const modelMatrixT3 = defUniformNamed( 'mat3', 'modelMatrixT3' );
  const samplerDensity = defUniformNamed( 'sampler2D', 'samplerDensity' );
  const samplerDeferredPos = defUniformNamed( 'sampler2D', 'samplerDeferredPos' );

  const { init, random4 } = glslDefRandom();

  const randomNormal = (): GLSLExpression<'float'> => (
    sw( boxMuller( sw( random4(), 'xy' ) ), 'x' )
  );

  const sampleLinear3D = defFluidSampleLinear3D();

  const getDensity = defFn( 'float', [ 'vec3' ], ( p ) => {
    const edgedecay = smoothstep( 0.5, 0.45, add( 0.5 / GRID_RESO, maxOfVec3( abs( p ) ) ) );
    ifThen( eq( edgedecay, 0.0 ), () => retFn( 0.0 ) );

    const pp = add( p, mul( 0.004, randomSphere() ) );
    const density = sw( sampleLinear3D( samplerDensity, pp ), 'x' );
    retFn( mul(
      edgedecay,
      glslSaturate( density ),
    ) );
  } );

  main( () => {
    const p = def( 'vec2', div( sw( vProjPosition, 'xy' ), sw( vProjPosition, 'w' ) ) );
    init( vec4( p, time, 1.0 ) );

    const [ ro, rd ] = setupRoRd( p );

    const rl0 = def( 'float', sub(
      length( sub( sw( vPositionWithoutModel, 'xyz' ), ro ) ),
      mul( 0.01, randomNormal() ),
    ) );
    const rl = def( 'float', rl0 );
    const rp = def( 'vec3', add( ro, mul( rd, rl ) ) );

    const uv = div( sw( glFragCoord, 'xy' ), resolution );
    const texDeferredPos = texture( samplerDeferredPos, uv );
    const rlMax = def( 'float', mix(
      length( sub( sw( texDeferredPos, 'xyz' ), ro ) ),
      1E9,
      step( 1.0, sw( texDeferredPos, 'w' ) ),
    ) );

    const accum = def( 'vec4', vec4( 0.0, 0.0, 0.0, 1.0 ) );
    const accumRGB = sw( accum, 'rgb' );
    const accumA = sw( accum, 'a' );

    forLoop( 50, () => {
      ifThen( lt( accumA, 0.01 ), () => forBreak() );

      const density = getDensity( rp );

      ifThen( gt( density, 1E-3 ), () => {
        forEachLights( ( { lightPos, lightColor } ) => {
          const [ L, lenL ] = calcL(
            mul( modelMatrixT3, lightPos ),
            rp,
          );

          const shadow = getDensity( add( rp, mul( L, 0.05 ) ) );

          addAssign( accumRGB, mul(
            glslSaturate( mad( 1.0, -1.5, shadow ) ),
            div( 1.0, sq( lenL ) ),
            lightColor,
            density,
            accumA,
          ) );
        } );

        mulAssign( accumA, sub( 1.0, density ) );
      } );

      addAssign( rl, mad( 0.02, 0.00, randomNormal() ) );
      assign( rp, add( ro, mul( rd, rl ) ) );

      ifThen( lt( rlMax, rl ), () => forBreak() );

    } );

    assign( fragColor, vec4( accumRGB, sub( 1.0, accumA ) ) );
  } );
} );
