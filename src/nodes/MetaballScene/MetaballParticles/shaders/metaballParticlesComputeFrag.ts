import { METABALL_PARTICLES_COUNT, METABALL_PARTICLES_COUNT_SQRT, METABALL_PARTICLES_SPAWN_LENGTH } from '../constants';
import { add, addAssign, and, assign, build, def, defInNamed, defOut, defUniformNamed, div, dot, exp, floor, ifThen, insert, lt, lte, mad, main, max, mix, mul, mulAssign, sub, subAssign, sw, texture, vec2, vec3, vec4 } from '../../../../shaders/shaderBuilder';
import { calcNormal } from '../../../../shaders/modules/calcNormal';
import { defMetaballMap } from '../../defMetaballMap';
import { glslDefRandom } from '../../../../shaders/modules/glslDefRandom';
import { glslLofi } from '../../../../shaders/modules/glslLofi';
import { perlin3d } from '../../../../shaders/modules/perlin3d';

export const metaballParticlesComputeFrag: string = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragCompute0 = defOut( 'vec4' );
  const fragCompute1 = defOut( 'vec4', 1 );

  const time = defUniformNamed( 'float', 'time' );
  const deltaTime = defUniformNamed( 'float', 'deltaTime' );
  const samplerCompute0 = defUniformNamed( 'sampler2D', 'samplerCompute0' );
  const samplerCompute1 = defUniformNamed( 'sampler2D', 'samplerCompute1' );

  const map = defMetaballMap( time );

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
    const d = sw( tex1, 'w' );

    const spawnTime = def( 'float', mix(
      0.0,
      METABALL_PARTICLES_SPAWN_LENGTH,
      dot(
        floor( mul( vUv, METABALL_PARTICLES_COUNT_SQRT ) ),
        vec2( 1.0 / METABALL_PARTICLES_COUNT_SQRT, 1.0 / METABALL_PARTICLES_COUNT )
      ),
    ) );
    addAssign( spawnTime, glslLofi( time, METABALL_PARTICLES_SPAWN_LENGTH ) );

    ifThen(
      lt( add( sub( time, deltaTime ), METABALL_PARTICLES_SPAWN_LENGTH ), spawnTime ),
      () => subAssign( spawnTime, METABALL_PARTICLES_SPAWN_LENGTH ),
    );

    // -- init particles ---------------------------------------------------------------------------
    ifThen( and( lt( sub( time, deltaTime ), spawnTime ), lte( spawnTime, time ) ), () => {
      assign( dt, sub( time, spawnTime ) );

      assign( pos, mix( vec3( -0.1 ), vec3( 0.1 ), vec3( random(), random(), random() ) ) );
      assign( vel, vec3( 0.0 ) );
      assign( life, 1.0 );
    } );

    // -- update particles -------------------------------------------------------------------------
    assign( d, sw( map( pos ), 'x' ) );

    // noise field
    addAssign( vel, mul(
      0.5,
      dt,
      vec3(
        perlin3d( mad( 10.0, pos, mad( 0.2, time, 0.0 ) ) ),
        perlin3d( mad( 10.0, pos, mad( 0.2, time, 10.0 ) ) ),
        perlin3d( mad( 10.0, pos, mad( 0.2, time, 20.0 ) ) ),
      ),
    ) );

    // resistance
    mulAssign( vel, exp( mul( -0.1, dt ) ) );

    // succ
    addAssign( vel, mul(
      calcNormal( { rp: pos, map, delta: 1E-4 } ),
      sub( 0.01, d ),
      8.0,
      dt,
    ) );

    // usual update stuff
    addAssign( pos, mul( vel, dt ) );
    assign( life, max( 0.0, sub( life, div( dt, METABALL_PARTICLES_SPAWN_LENGTH ) ) ) );

    assign( d, sw( map( pos ), 'x' ) );

    // -- almost done ------------------------------------------------------------------------------
    assign( fragCompute0, tex0 );
    assign( fragCompute1, tex1 );

  } );
} );
