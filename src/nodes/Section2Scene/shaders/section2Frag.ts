import { FAR } from '../../../config';
import { GLSLExpression, abs, add, addAssign, assign, build, cos, def, defInNamed, defOut, defUniformNamed, discard, div, dot, eq, forLoop, glFragDepth, ifThen, insert, length, lt, mad, main, max, mix, mul, mulAssign, neg, normalize, pow, reflect, retFn, sin, step, sub, sw, texture, vec2, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { HALF_PI, TAU } from '../../../utils/constants';
import { MTL_UNLIT } from '../../CameraStack/deferredConstants';
import { calcShadowDepth } from '../../../shaders/modules/calcShadowDepth';
import { fresnelSchlick } from '../../../shaders/modules/fresnelSchlick';
import { glslDefRandom } from '../../../shaders/modules/glslDefRandom';
import { isectBox } from '../../../shaders/modules/isectBox';
import { isectMin } from '../../../shaders/modules/isectMin';
import { isectPillar } from '../../../shaders/modules/isectPillar';
import { isectPlane } from '../../../shaders/modules/isectPlane';
import { rotate2D } from '../../../shaders/modules/rotate2D';
import { sampleGGX } from '../../../shaders/modules/sampleGGX';
import { sampleLambert } from '../../../shaders/modules/sampleLambert';
import { setupRoRd } from '../../../shaders/modules/setupRoRd';

export const section2Frag = ( tag: 'deferred' | 'depth' ): string => build( () => {
  insert( 'precision highp float;' );

  const vProjPosition = defInNamed( 'vec4', 'vProjPosition' );
  const vPositionWithoutModel = defInNamed( 'vec4', 'vPositionWithoutModel' );

  const pvm = defUniformNamed( 'mat4', 'pvm' );
  const modelMatrix = defUniformNamed( 'mat4', 'modelMatrix' );
  const normalMatrix = defUniformNamed( 'mat3', 'normalMatrix' );
  const sampler0 = defUniformNamed( 'sampler2D', 'sampler0' );

  const fragColor = defOut( 'vec4' );
  const fragPosition = defOut( 'vec4', 1 );
  const fragNormal = defOut( 'vec4', 2 );
  const fragMisc = defOut( 'vec4', 3 );

  const time = defUniformNamed( 'float', 'time' );

  const { init, random, random2 } = glslDefRandom();

  main( () => {
    const p = def( 'vec2', div( sw( vProjPosition, 'xy' ), sw( vProjPosition, 'w' ) ) );
    init( vec4( p, time, 1.0 ) );

    const flicker = mad( 0.1, sin( mul( TAU, 60.0, mad( 0.08, sw( p, 'y' ), time ) ) ), 0.9 );

    const [ ro, rd ] = setupRoRd( p );
    const initRl = def( 'float', length( sub( sw( vPositionWithoutModel, 'xyz' ), ro ) ) );
    addAssign( ro, mul( rd, initRl ) );

    const ro0 = def( 'vec3', ro );
    const rd0 = def( 'vec3', rd );

    const isFirstRay = def( 'float', 1.0 );

    const N0 = def( 'vec3' );
    const col = def( 'vec3', vec3( 0.0 ) );
    const colRem = def( 'vec3', vec3( 1.0 ) );
    const samples = def( 'float', 1.0 );

    const baseColor = def( 'vec3', vec3( 0.0 ) );
    const emissive = def( 'vec3', vec3( 0.0 ) );
    const roughness = def( 'float', 0.0 );
    const metallic = def( 'float', 0.0 );

    const baseColor0 = def( 'vec3', vec3( 0.0 ) );
    const emissive0 = def( 'vec3', vec3( 0.0 ) );
    const roughness0 = def( 'float', 0.0 );
    const metallic0 = def( 'float', 0.0 );

    const doReflection = ( N: GLSLExpression<'vec3'> ): void => {
      addAssign( col, mul( colRem, emissive ) );

      const f0 = mix( vec3( 0.04 ), baseColor, metallic );

      ifThen( lt( random(), 0.5 ), () => {
        const h = def( 'vec3', sampleGGX(
          random2(),
          N,
          roughness,
        ) );

        const dotVH = def( 'float', max( 0.001, dot( neg( rd ), h ) ) );

        assign( rd, normalize( reflect( rd, h ) ) );

        mulAssign( colRem, fresnelSchlick( dotVH, f0, vec3( 1.0 ) ) );
      }, () => {
        const wo = def( 'vec3', sampleLambert( N ) );
        const h = normalize( sub( wo, rd ) );

        const dotVH = def( 'float', max( 0.001, dot( neg( rd ), h ) ) );
        mulAssign( colRem, mul( baseColor, sub( 1.0, fresnelSchlick( dotVH, f0, vec3( 1.0 ) ) ) ) );

        assign( rd, wo );
      } );

      mulAssign( colRem, step( 0.0, dot( rd, N ) ) );
    };

    forLoop( 30, () => {
      const rot = def( 'vec3', ro );
      const isect = def( 'vec4', vec4( FAR ) );
      const isect2 = def( 'vec4', vec4( FAR ) );

      const N = sw( isect, 'xyz' );
      const isectlen = sw( isect, 'w' );

      // sign emission
      assign( rot, sub( ro, vec3( 0.0, 0.0, -1.0 ) ) );
      assign( isect2, isectBox( rot, rd, vec3( 0.4, 0.2, 0.08 ) ) );

      ifThen( lt( sw( isect2, 'w' ), isectlen ), () => {
        assign( isect, isect2 );
        const rp = mad( isectlen, rd, rot );
        const m = mad(
          abs( cos( mul( 4.0, sw( rp, 'x' ) ) ) ),
          abs( cos( mul( 8.0, sw( rp, 'y' ) ) ) ),
          0.1,
        );
        const tex = sw( texture(
          sampler0,
          mad( vec2( 1.5, 3.0 ), sw( rp, 'xy' ), vec2( 0.5 ) ),
        ), 'x' );

        assign( baseColor, vec3( 0.8 ) );
        assign( emissive, vec3( mul( flicker, m, tex ) ) );
        assign( roughness, 0.2 );
        assign( metallic, 0.0 );
      } );

      // sign frame
      assign( isect2, isectMin(
        isectMin(
          isectBox(
            sub( rot, vec3( 0.4, 0.0, 0.0 ) ),
            rd,
            vec3( 0.01, 0.2, 0.1 ),
          ),
          isectBox(
            sub( rot, vec3( -0.4, 0.0, 0.0 ) ),
            rd,
            vec3( 0.01, 0.2, 0.1 ),
          ),
        ),
        isectMin(
          isectBox(
            sub( rot, vec3( 0.0, 0.2, 0.0 ) ),
            rd,
            vec3( 0.41, 0.01, 0.1 ),
          ),
          isectBox(
            sub( rot, vec3( 0.0, -0.2, 0.0 ) ),
            rd,
            vec3( 0.41, 0.01, 0.1 ),
          ),
        ),
      ) );

      ifThen( lt( sw( isect2, 'w' ), isectlen ), () => {
        assign( isect, isect2 );
        assign( baseColor, vec3( 0.8 ) );
        assign( emissive, vec3( 0.0 ) );
        assign( roughness, 0.2 );
        assign( metallic, 1.0 );
      } );

      // ceil
      assign( rot, sub( ro, vec3( -0.6, 0.22, 0.0 ) ) );
      assign( isect2, vec4( 0.0, -1.0, 0.0, isectPlane( rot, rd, vec3( 0.0, -1.0, 0.0 ) ) ) );

      ifThen( lt( sw( isect2, 'w' ), isectlen ), () => {
        assign( isect, isect2 );
        const rp = mad( isectlen, rd, rot );
        const mtl = step( -0.99, cos( mul( 40.0, sw( rp, 'z' ) ) ) );

        assign( baseColor, mix( vec3( 0.0 ), vec3( 0.8 ), mtl ) );
        assign( emissive, vec3( 0.0 ) );
        assign( roughness, mix( 1.0, 0.02, mtl ) );
        assign( metallic, 0.0 );
      } );

      // tube
      assign( isect2, isectBox( rot, rd, vec3( 0.1, 0.001, 10.0 ) ) );

      ifThen( lt( sw( isect2, 'w' ), isectlen ), () => {
        assign( isect, isect2 );
        const rp = mad( isectlen, rd, rot );
        const m = add(
          mul(
            2.0,
            flicker,
            abs( cos( mul( 14.0, sw( rp, 'x' ) ) ) ),
            abs( cos( mul( 2.0, sw( rp, 'z' ) ) ) ),
          ),
          0.1,
        );

        assign( baseColor, vec3( 0.4 ) );
        assign( emissive, vec3( m ) );
        assign( roughness, 0.1 );
        assign( metallic, 0.0 );
      } );

      // pillar
      assign( rot, sub( ro, vec3( 0.5, -0.0, -1.5 ) ) );
      const rdt = def( 'vec3', rd );
      mulAssign( sw( rot, 'yz' ), rotate2D( HALF_PI ) );
      mulAssign( sw( rdt, 'yz' ), rotate2D( HALF_PI ) );
      assign( isect2, isectPillar( rot, rdt, 0.2, 10.0 ) );

      ifThen( lt( sw( isect2, 'w' ), isectlen ), () => {
        assign( isect, isect2 );
        mulAssign( sw( N, 'zy' ), rotate2D( HALF_PI ) );
        assign( baseColor, vec3( 0.8 ) );
        assign( emissive, vec3( 0.0 ) );
        assign( roughness, 0.02 );
        assign( metallic, 0.0 );
      } );

      // floor
      assign( rot, sub( ro, vec3( 0.0, -3.0, 0.0 ) ) );
      assign( isect2, vec4( 0.0, 1.0, 0.0, isectPlane( rot, rd, vec3( 0.0, 1.0, 0.0 ) ) ) );

      ifThen( lt( sw( isect2, 'w' ), isectlen ), () => {
        assign( isect, isect2 );
        assign( baseColor, vec3( 1.0 ) );
        assign( emissive, vec3( 0.0 ) );
        assign( roughness, 1.0 );
        assign( metallic, 0.0 );
      } );

      ifThen( lt( isectlen, FAR ), () => {
        // update ray origin
        addAssign( ro, mul( rd, isectlen ) );

        // record the first ray
        ifThen( eq( isFirstRay, 1.0 ), () => {
          // smooth
          assign( ro0, ro );
          assign( N0, N );
          assign( baseColor0, baseColor );
          assign( emissive0, emissive );
          assign( roughness0, roughness );
          assign( metallic0, metallic );

          assign( isFirstRay, 0.0 );
        } );

        // reflect
        doReflection( N );
        addAssign( ro, mul( 1E-3, rd ) );

      }, () => {
        mulAssign( colRem, 0.0 );

      } );

      ifThen( lt( sw( colRem, 'x' ), 0.04 ), () => {
        assign( colRem, vec3( 1.0 ) );
        addAssign( samples, 1.0 );

        assign( ro, ro0 );
        assign( rd, rd0 );
        assign( baseColor, baseColor0 );
        assign( emissive, emissive0 );
        assign( roughness, roughness0 );
        assign( metallic, metallic0 );

        doReflection( N0 );
        addAssign( ro, mul( 1E-3, rd ) );

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
      assign( fragColor, calcShadowDepth( projPos ) );
      retFn();

    }

    assign( fragColor, vec4( pow( div( col, samples, 0.5 ), vec3( 0.5 ) ), 1.0 ) );
    assign( fragPosition, vec4( sw( modelPos, 'xyz' ), depth ) );
    assign( fragNormal, vec4( normalize( mul( normalMatrix, N0 ) ), MTL_UNLIT ) );
    assign( fragMisc, vec4( 0.0 ) );

  } );
} );
