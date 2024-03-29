import { AO_ITER } from '../../../config';
import { GLSLExpression, add, addAssign, assign, build, def, defInNamed, defOut, defUniformNamed, div, divAssign, dot, eq, forLoop, ifThen, insert, length, lt, main, mul, normalize, sq, sub, sw, texture, vec4 } from '../../../shaders/shaderBuilder';
import { glslDefRandom } from '../../../shaders/modules/glslDefRandom';
import { glslSaturate } from '../../../shaders/modules/glslSaturate';
import { randomHemisphere } from '../../../shaders/modules/randomHemisphere';

const AO_BIAS = 0.0;
const AO_RADIUS = 0.5;

export const ssaoFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'float' );

  const time = defUniformNamed( 'float', 'time' );
  const aspect = defUniformNamed( 'float', 'aspect' );
  const cameraPV = defUniformNamed( 'mat4', 'cameraPV' );
  const sampler1 = defUniformNamed( 'sampler2D', 'sampler1' ); // position.xyz, depth
  const sampler2 = defUniformNamed( 'sampler2D', 'sampler2' ); // normal.xyz

  const { init, random } = glslDefRandom();

  function ssao(
    position: GLSLExpression<'vec3'>,
    normal: GLSLExpression<'vec3'>,
  ): GLSLExpression<'float'> {
    const accum = def( 'float', 0.0 );

    forLoop( AO_ITER, () => {
      const pt = add(
        position,
        mul( AO_RADIUS, random(), randomHemisphere( normal ) ),
      );

      const screenPos = def( 'vec4', mul( cameraPV, vec4( pt, 1.0 ) ) );
      divAssign( sw( screenPos, 'x' ), aspect );
      const screenUv = add( 0.5, mul( 0.5, div( sw( screenPos, 'xy' ), sw( screenPos, 'w' ) ) ) );
      const s1 = texture( sampler1, screenUv );

      ifThen( eq( sw( s1, 'w' ), 1.0 ), () => {
        addAssign( accum, 1.0 );
      }, () => {
        const dDir = def( 'vec3', sub( sw( s1, 'xyz' ), position ) );
        ifThen( lt( length( dDir ), 1E-2 ), () => {
          addAssign( accum, 1.0 );
        }, () => {
          const dNor = dot( normalize( normal ), normalize( dDir ) );
          addAssign(
            accum,
            sub( 1.0, div( glslSaturate( sub( dNor, AO_BIAS ) ), add( length( dDir ), 1.0 ) ) )
          );
        } );
      } );
    } );

    return sq( glslSaturate( div( accum, AO_ITER ) ) );
  }

  main( () => {
    init( vec4( vUv, time, 1.0 ) );

    const tex1 = texture( sampler1, vUv );
    const tex2 = texture( sampler2, vUv );

    const position = def( 'vec4', tex1 );
    const normal = def( 'vec3', sw( tex2, 'xyz' ) );

    ifThen( eq( sw( position, 'w' ), 1.0 ), () => {
      assign( fragColor, 1.0 );
    }, () => {
      assign( fragColor, ssao( sw( position, 'xyz' ), normal ) );
    } );
  } );
} );
