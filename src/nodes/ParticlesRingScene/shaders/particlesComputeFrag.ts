import { PARTICLES_COUNT, PARTICLES_COUNT_SQRT, PARTICLES_SPAWN_LENGTH } from '../constants';
import { TAU } from '../../../utils/constants';
import { add, addAssign, and, assign, build, def, defInNamed, defOut, defUniformNamed, div, dot, exp, floor, ifThen, insert, length, lt, lte, main, max, mix, mul, mulAssign, normalize, sub, subAssign, sw, texture, vec2, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { cis } from '../../../shaders/modules/cis';
import { glslDefRandom } from '../../../shaders/modules/glslDefRandom';
import { glslLofi } from '../../../shaders/modules/glslLofi';
import { perlin3d } from '../../../shaders/modules/perlin3d';

export const particlesComputeFrag: string = build( () => {
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
      PARTICLES_SPAWN_LENGTH,
      dot(
        floor( mul( vUv, PARTICLES_COUNT_SQRT ) ),
        vec2( 1.0 / PARTICLES_COUNT_SQRT, 1.0 / PARTICLES_COUNT )
      ),
    ) );
    addAssign( spawnTime, glslLofi( time, PARTICLES_SPAWN_LENGTH ) );

    ifThen(
      lt( add( sub( time, deltaTime ), PARTICLES_SPAWN_LENGTH ), spawnTime ),
      () => subAssign( spawnTime, PARTICLES_SPAWN_LENGTH ),
    );

    // -- init particles ---------------------------------------------------------------------------
    ifThen( and( lt( sub( time, deltaTime ), spawnTime ), lte( spawnTime, time ) ), () => {
      assign( dt, sub( time, spawnTime ) );

      const x = def( 'float', mul( TAU, random() ) );
      assign( pos, vec3(
        mul( 1.5, cis( x ) ),
        0.0,
      ) );
      assign( vel, vec3( 0.0 ) );
      assign( life, 1.0 );
    } );

    // -- update particles -------------------------------------------------------------------------
    // noise field
    addAssign( vel, mul(
      2.0,
      dt,
      vec3(
        perlin3d( add( mul( 0.2, time ), pos, 0.0 ) ),
        perlin3d( add( mul( 0.2, time ), pos, 10.0 ) ),
        perlin3d( add( mul( 0.2, time ), pos, 20.0 ) ),
      ),
    ) );

    // don't come to the center
    addAssign( vel, mul(
      dt,
      2.0,
      normalize( pos ),
      max( 0.0, sub( 1.5, length( pos ) ) ),
    ) );

    // rotation
    addAssign( sw( vel, 'zx' ), mul( 0.2, dt, vec2( 1.0, -1.0 ), sw( pos, 'xz' ) ) );

    // resistance
    mulAssign( vel, exp( mul( -1.0, dt ) ) );

    // usual update stuff
    addAssign( pos, mul( vel, dt ) );
    assign( life, max( 0.0, sub( life, div( dt, PARTICLES_SPAWN_LENGTH ) ) ) );

    // -- almost done ------------------------------------------------------------------------------
    assign( fragCompute0, tex0 );
    assign( fragCompute1, tex1 );

  } );
} );
