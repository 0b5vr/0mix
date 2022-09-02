import { add, addAssign, and, assign, build, def, defInNamed, defOut, defUniformNamed, div, dot, exp, floor, ifThen, insert, lt, lte, main, max, mix, mul, mulAssign, sin, sub, subAssign, sw, texture, vec2, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { cyclicNoise } from '../../../shaders/modules/cyclicNoise';
import { glslDefRandom } from '../../../shaders/modules/glslDefRandom';
import { glslLofi } from '../../../shaders/modules/glslLofi';

export const dustComputeFrag = (
  { particlesSqrt, particleSpawnLength }: {
    particlesSqrt: number,
    particleSpawnLength: number,
  },
): string => build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragCompute0 = defOut( 'vec4' );
  const fragCompute1 = defOut( 'vec4', 1 );

  const time = defUniformNamed( 'float', 'time' );
  const deltaTime = defUniformNamed( 'float', 'deltaTime' );
  const samplerCompute0 = defUniformNamed( 'sampler2D', 'samplerCompute0' );
  const samplerCompute1 = defUniformNamed( 'sampler2D', 'samplerCompute1' );

  const { init, random } = glslDefRandom();

  main( () => {
    const dt = def( 'float', deltaTime );

    // -- prepare some vars ------------------------------------------------------------------------
    init( vec4( vUv, time, 1.0 ) );

    const tex0 = def( 'vec4', texture( samplerCompute0, vUv ) );
    const tex1 = def( 'vec4', texture( samplerCompute1, vUv ) );

    const pos = sw( tex0, 'xyz' );
    const life = sw( tex0, 'w' );
    const vel = sw( tex1, 'xyz' );

    const spawnTime = def( 'float', mix(
      0.0,
      particleSpawnLength,
      dot(
        floor( mul( vUv, particlesSqrt ) ),
        vec2( 1.0 / particlesSqrt, 1.0 / particlesSqrt / particlesSqrt )
      ),
    ) );
    addAssign( spawnTime, glslLofi( time, particleSpawnLength ) );

    ifThen(
      lt( add( sub( time, deltaTime ), particleSpawnLength ), spawnTime ),
      () => subAssign( spawnTime, particleSpawnLength ),
    );

    // -- init particles ---------------------------------------------------------------------------
    ifThen( and( lt( sub( time, deltaTime ), spawnTime ), lte( spawnTime, time ) ), () => {
      assign( dt, sub( time, spawnTime ) );

      assign( pos, mix(
        vec3( -1.0 ),
        vec3( 1.0 ),
        vec3( random(), random(), random() ),
      ) );
      assign( vel, vec3( 0.0 ) );
      assign( life, 1.0 );
    } );

    // -- update particles -------------------------------------------------------------------------
    // noise field
    const cyclicV = add(
      mul( 0.5, pos ),
      sin( mul( 0.1, time ) ),
    );
    addAssign( vel, mul( 0.1, dt, cyclicNoise( cyclicV ) ) );

    // resistance
    mulAssign( vel, exp( mul( -10.0, dt ) ) );

    // succ
    // addAssign( vel, mul( dt, -10.0, pos ) );

    // usual update stuff
    addAssign( pos, mul( vel, dt ) );
    assign( life, max( 0.0, sub( life, div( dt, particleSpawnLength ) ) ) );

    // -- almost done ------------------------------------------------------------------------------
    assign( fragCompute0, tex0 );
    assign( fragCompute1, tex1 );

  } );
} );
