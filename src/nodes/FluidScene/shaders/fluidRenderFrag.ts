import { GRID_RESO } from '../constants';
import { abs, add, addAssign, assign, build, def, defFn, defInNamed, defOut, defUniformNamed, div, eq, forBreak, forLoop, gt, ifThen, insert, length, lt, main, mix, mul, mulAssign, retFn, smoothstep, sq, sub, sw, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { calcL } from '../../../shaders/modules/calcL';
import { defFluidSampleLinear3D } from './defFluidSampleLinear3D';
import { forEachLights } from '../../../shaders/modules/forEachLights';
import { glslDefRandom } from '../../../shaders/modules/glslDefRandom';
import { glslSaturate } from '../../../shaders/modules/glslSaturate';
import { maxOfVec3 } from '../../../shaders/modules/maxOfVec3';
import { setupRoRd } from '../../../shaders/modules/setupRoRd';

export const fluidRenderFrag: string = build( () => {
  insert( 'precision highp float;' );

  const vProjPosition = defInNamed( 'vec4', 'vProjPosition' );
  const vPositionWithoutModel = defInNamed( 'vec4', 'vPositionWithoutModel' );

  const fragColor = defOut( 'vec4' );

  const time = defUniformNamed( 'float', 'time' );
  const modelMatrixT3 = defUniformNamed( 'mat3', 'modelMatrixT3' );
  const samplerDensity = defUniformNamed( 'sampler2D', 'samplerDensity' );

  const { init, random } = glslDefRandom();

  const sampleLinear3D = defFluidSampleLinear3D();

  const getDensity = defFn( 'float', [ 'vec3' ], ( p ) => {
    const edgedecay = smoothstep( 0.5, 0.45, add( 0.5 / GRID_RESO, maxOfVec3( abs( p ) ) ) );
    ifThen( eq( edgedecay, 0.0 ), () => retFn( 0.0 ) );

    retFn( mul(
      edgedecay,
      glslSaturate( mul( 0.05, sq( sw( sampleLinear3D( samplerDensity, p ), 'x' ) ) ) ),
    ) );
  } );

  main( () => {
    const p = def( 'vec2', div( sw( vProjPosition, 'xy' ), sw( vProjPosition, 'w' ) ) );
    init( vec4( p, time, 1.0 ) );

    const [ ro, rd ] = setupRoRd( p );

    const rl0 = def( 'float', sub(
      length( sub( sw( vPositionWithoutModel, 'xyz' ), ro ) ),
      mul( 0.05, random() ),
    ) );
    const rp = def( 'vec3', add( ro, mul( rd, rl0 ) ) );

    const accum = def( 'vec4', vec4( 0.0, 0.0, 0.0, 1.0 ) );
    const accumRGB = sw( accum, 'rgb' );
    const accumA = sw( accum, 'a' );

    forLoop( 50, () => {
      ifThen( lt( accumA, 0.1 ), () => forBreak() );

      const density = getDensity( rp );

      ifThen( gt( density, 1E-3 ), () => {
        forEachLights( ( { lightPos, lightColor } ) => {
          const [ L, lenL ] = calcL(
            mul( modelMatrixT3, lightPos ),
            rp,
          );

          const shadow = getDensity( add( rp, mul( L, 0.03 ) ) );

          const col = mix( vec3( 0.7, 0.9, 1.0 ), vec3( 1.0, 0.9, 0.8 ), density );
          addAssign( accumRGB, mul(
            glslSaturate( mix( 1.0, -2.0, shadow ) ),
            div( 1.0, sq( lenL ) ),
            lightColor,
            density,
            col,
            accumA,
          ) );
        } );

        mulAssign( accumA, sub( 1.0, density ) );
      } );

      addAssign( rp, mul( rd, mix( 0.01, 0.02, random() ) ) );

    } );

    assign( fragColor, vec4( accumRGB, 1.0 ) );
  } );
} );
