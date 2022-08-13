import { PARTICLES_COUNT, PARTICLES_COUNT_SQRT, PARTICLES_SPAWN_LENGTH } from '../constants';
import { add, addAssign, and, assign, build, def, defInNamed, defOut, defUniformNamed, div, dot, exp, floor, ifThen, insert, length, lt, lte, mad, main, max, mix, mul, mulAssign, normalize, sub, subAssign, sw, texture, vec2, vec3 } from '../../../shaders/shaderBuilder';
import { glslDefRandom } from '../../../shaders/modules/glslDefRandom';
import { glslLofi } from '../../../shaders/modules/glslLofi';
import { perlin3d } from '../../../shaders/modules/perlin3d';
import { uniformSphere } from '../../../shaders/modules/uniformSphere';

export const particlesComputeFrag: string = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragCompute0 = defOut( 'vec4' );
  const fragCompute1 = defOut( 'vec4', 1 );

  const time = defUniformNamed( 'float', 'time' );
  const deltaTime = defUniformNamed( 'float', 'deltaTime' );
  const samplerCompute0 = defUniformNamed( 'sampler2D', 'samplerCompute0' );
  const samplerCompute1 = defUniformNamed( 'sampler2D', 'samplerCompute1' );
  const samplerRandom = defUniformNamed( 'sampler2D', 'samplerRandom' );

  const { init, random } = glslDefRandom();

  main( () => {
    const dt = def( 'float', deltaTime );

    // -- prepare some vars ------------------------------------------------------------------------
    const seed = texture( samplerRandom, vUv );
    init( seed );

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

      assign( pos, mul( random(), uniformSphere() ) );
      assign( vel, vec3( 0.0 ) );
      assign( life, 1.0 );
    } );

    // -- update particles -------------------------------------------------------------------------
    // noise field
    addAssign( vel, mul(
      2.0,
      dt,
      vec3(
        perlin3d( mad( mad( 0.0, 0.2, time ), 2.0, pos ) ),
        perlin3d( mad( mad( 10.0, 0.2, time ), 2.0, pos ) ),
        perlin3d( mad( mad( 20.0, 0.2, time ), 2.0, pos ) ),
      ),
    ) );

    // rotation
    addAssign( sw( vel, 'zx' ), mul( dt, vec2( 1.0, -1.0 ), sw( pos, 'xz' ) ) );

    // succ
    // addAssign( vel, mul( dt, 4.0, normalize( sub( vec3( 0.3 ), pos ) ) ) );
    addAssign( vel, mul(
      dt,
      -2.0,
      normalize( pos ),
      max( 0.0, sub( length( pos ), 1.0 ) ),
    ) );

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
