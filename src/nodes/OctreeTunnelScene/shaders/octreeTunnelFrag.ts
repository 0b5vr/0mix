import { FAR } from '../../../config';
import { GLSLExpression, GLSLToken, abs, add, addAssign, and, assign, build, def, defInNamed, defOut, defUniformNamed, discard, div, divAssign, dot, eq, floor, forBreak, forLoop, glFragCoord, glFragDepth, glslFalse, glslTrue, gt, ifThen, insert, length, lt, mad, main, max, min, mul, mulAssign, neg, normalize, not, num, or, reflect, retFn, sin, smoothstep, sq, sub, subAssign, sw, vec2, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { MTL_UNLIT } from '../../CameraStack/deferredConstants';
import { TAU } from '../../../utils/constants';
import { calcShadowDepth } from '../../../shaders/modules/calcShadowDepth';
import { fresnelSchlick } from '../../../shaders/modules/fresnelSchlick';
import { glslDefRandom } from '../../../shaders/modules/glslDefRandom';
import { glslLofi } from '../../../shaders/modules/glslLofi';
import { isectBox } from '../../../shaders/modules/isectBox';
import { pcg3df } from '../../../shaders/modules/pcg3df';
import { sampleGGX } from '../../../shaders/modules/sampleGGX';
import { setupRoRd } from '../../../shaders/modules/setupRoRd';

export const octreeTunnelFrag = ( tag: 'deferred' | 'depth' ): string => build( () => {
  insert( 'precision highp float;' );

  const vPositionWithoutModel = defInNamed( 'vec4', 'vPositionWithoutModel' );
  const pvm = defUniformNamed( 'mat4', 'pvm' );
  const modelMatrix = defUniformNamed( 'mat4', 'modelMatrix' );
  const normalMatrix = defUniformNamed( 'mat3', 'normalMatrix' );

  const fragColor = defOut( 'vec4' );
  const fragPosition = defOut( 'vec4', 1 );
  const fragNormal = defOut( 'vec4', 2 );
  const fragMisc = defOut( 'vec4', 3 );

  const density = defUniformNamed( 'float', 'density' );
  const diceSize = defUniformNamed( 'float', 'diceSize' );
  const time = defUniformNamed( 'float', 'time' );
  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const cameraNearFar = defUniformNamed( 'vec2', 'cameraNearFar' );
  const cameraPos = defUniformNamed( 'vec3', 'cameraPos' );
  const inversePVM = defUniformNamed( 'mat4', 'inversePVM' );

  const { init, random } = glslDefRandom();

  const qt = ( ro: GLSLExpression<'vec3'>, rd: GLSLExpression<'vec3'> ): {
    cell: GLSLToken<'vec3'>,
    dice: GLSLToken<'vec3'>,
    len: GLSLToken<'float'>,
    size: GLSLToken<'float'>,
    hole: GLSLToken<'bool'>,
  } => {
    const haha = def( 'float', sw( pcg3df(
      floor( mul( vec3( 2.0, 2.0, 0.0 ), mad( ro, rd, 1E-2 ) ) ),
    ), 'x' ) );
    assign( haha, mul(
      2.0,
      smoothstep( -0.5, 0.5, sin( add( mul( 0.5, time ), mul( TAU, haha ) ) ) ),
    ) );

    const rot = def( 'vec3', ro );
    addAssign( sw( rot, 'z' ), haha );

    const size = def( 'float', 1.0 );
    const cell = def( 'vec3' );
    const dice = def( 'vec3' );
    const hole = def( 'bool', glslFalse );

    forLoop( 4, () => {
      divAssign( size, 2.0 );
      assign( cell, add(
        glslLofi( add( rot, mul( rd, 0.01, size ) ), size ),
        div( size, 2.0 ),
      ) );
      assign( dice, pcg3df( floor( mul( diceSize, cell ) ) ) );
      assign( hole, or(
        lt( density, sw( dice, 'y' ) ),
        and(
          lt( abs( sw( cell, 'x' ) ), 0.5 ),
          lt( abs( sw( cell, 'y' ) ), 0.5 ),
        ),
      ) );
      ifThen( hole, () => forBreak() );
      ifThen( gt( sw( dice, 'x' ), mul( size, 1.5 ) ), () => forBreak() );
    } );

    const src = neg( div( sub( rot, cell ), rd ) );
    const dst = abs( div( size, 2.0, rd ) );
    const b = add( src, dst );
    const len = def( 'float', min( sw( b, 'x' ), min( sw( b, 'y' ), sw( b, 'z' ) ) ) );

    subAssign( sw( cell, 'z' ), haha );

    return { size, cell, len, dice, hole };
  };

  main( () => {
    const p = def( 'vec2', div(
      sub( mul( 2.0, sw( glFragCoord, 'xy' ) ), resolution ),
      sw( resolution, 'y' ),
    ) );
    init( vec4( p, time, 1.0 ) );

    const { ro, rd } = setupRoRd( { inversePVM, p } );
    const initRl = def( 'float', length( sub( sw( vPositionWithoutModel, 'xyz' ), ro ) ) );
    addAssign( ro, mul( rd, initRl ) );

    const ro0 = def( 'vec3' );
    const rd0 = def( 'vec3', rd );

    const isFirstRay = def( 'bool', glslTrue );

    const N0 = def( 'vec3' );
    const rough0 = def( 'float' );
    const col = def( 'vec3', vec3( 0.0 ) );
    const colRem = def( 'vec3', vec3( 1.0 ) );
    const samples = def( 'float', 1.0 );

    const doReflection = ( N: GLSLExpression<'vec3'>, rough: GLSLExpression<'float'> ): void => {
      // reflective
      const h = def( 'vec3', sampleGGX(
        vec2( random(), random() ),
        N,
        sq( rough ),
      ) );
      const dotVH = def( 'float', max( 0.001, dot( neg( rd ), h ) ) );

      assign( rd, reflect( rd, h ) );

      addAssign( ro, mul( rd, 0.01 ) );

      mulAssign( colRem, fresnelSchlick( dotVH, num( 0.3 ), num( 1.0 ) ) );
    };

    forLoop( 80, () => {
      const qtr = qt( ro, rd );

      const isect = def( 'vec4', vec4( FAR ) );
      const N = sw( isect, 'xyz' );
      const isectlen = sw( isect, 'w' );

      ifThen( not( qtr.hole ), () => {
        const size = sub( mul( 0.5, qtr.size ), 0.01 );
        assign( isect, isectBox( sub( ro, qtr.cell ), rd, vec3( size ) ) );
      } );

      ifThen( lt( isectlen, FAR ), () => {
        // update ray origin, calc roughness
        addAssign( ro, mul( rd, isectlen ) );
        const rough = sw( qtr.dice, 'z' );

        // record the first ray
        ifThen( isFirstRay, () => {
          assign( ro0, ro );
          assign( N0, N );
          assign( rough0, rough );
        } );

        ifThen( gt( rough, 0.7 ), () => {
          // emissive
          addAssign( col, mul( rough, colRem ) );
          mulAssign( colRem, 0.0 );

          ifThen( isFirstRay, () => forBreak() );
        } );

        doReflection( N, rough );
        assign( isFirstRay, glslFalse );

      }, () => {
        // update ray origin
        addAssign( ro, mul( rd, qtr.len ) );
      } );

      ifThen( lt( sw( colRem, 'x' ), 0.04 ), () => {
        assign( colRem, vec3( 1.0 ) );
        addAssign( samples, 1.0 );

        assign( ro, ro0 );
        assign( rd, rd0 );

        doReflection( N0, rough0 );

      } );
    } );

    ifThen( eq( N0, vec3( 0.0 ) ), () => {
      discard();
      retFn();
    } );

    const modelPos = def( 'vec4', mul( modelMatrix, vec4( ro0, 1.0 ) ) );

    const projPos = def( 'vec4', mul( pvm, vec4( ro0, 1.0 ) ) );
    const depth = div( sw( projPos, 'z' ), sw( projPos, 'w' ) );
    assign( glFragDepth, add( 0.5, mul( 0.5, depth ) ) );

    if ( tag === 'depth' ) {
      const len = length( sub( cameraPos, sw( modelPos, 'xyz' ) ) );
      assign( fragColor, calcShadowDepth( cameraNearFar, len ) );
      retFn();

    }

    assign( fragColor, vec4( div( col, samples, 0.5 ), 1.0 ) );
    assign( fragPosition, vec4( sw( modelPos, 'xyz' ), depth ) );
    assign( fragNormal, vec4( normalize( mul( normalMatrix, N0 ) ), MTL_UNLIT ) );
    assign( fragMisc, vec4( 0.0 ) );

  } );
} );