import { REC_TRAILS_LENGTH, TRAILS_COUNT, TRAILS_SPAWN_LENGTH } from '../constants';
import { add, addAssign, and, assign, build, def, defInNamed, defOut, defUniformNamed, div, exp, floor, gt, ifThen, insert, length, lt, lte, mad, main, max, min, mix, mul, mulAssign, normalize, sin, sub, subAssign, sw, texture, vec3 } from '../../../../shaders/shaderBuilder';
import { glslDefRandom } from '../../../../shaders/modules/glslDefRandom';
import { glslLofi } from '../../../../shaders/modules/glslLofi';
import { perlin3d } from '../../../../shaders/modules/perlin3d';
import { uniformSphere } from '../../../../shaders/modules/uniformSphere';

export const trailsComputeFrag: string = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragCompute0 = defOut( 'vec4' );
  const fragCompute1 = defOut( 'vec4', 1 );

  const shouldUpdate = defUniformNamed( 'bool', 'shouldUpdate' );
  const shouldInit = defUniformNamed( 'bool', 'shouldInit' );
  const time = defUniformNamed( 'float', 'time' );
  const deltaTime = defUniformNamed( 'float', 'deltaTime' );
  const samplerCompute0 = defUniformNamed( 'sampler2D', 'samplerCompute0' );
  const samplerCompute1 = defUniformNamed( 'sampler2D', 'samplerCompute1' );
  const samplerRandom = defUniformNamed( 'sampler2D', 'samplerRandom' );

  const { init } = glslDefRandom();

  main( () => {
    const uv = def( 'vec2', vUv );

    const dt = def( 'float', deltaTime );

    const tex0 = def( 'vec4' );
    const tex1 = def( 'vec4' );

    const pos = sw( tex0, 'xyz' );
    const life = sw( tex0, 'w' );
    const vel = sw( tex1, 'xyz' );
    const jumpFlag = sw( tex1, 'w' );

    ifThen( gt( sw( uv, 'x' ), REC_TRAILS_LENGTH ), () => {
      // -- if it's not head of particles ----------------------------------------------------------
      ifThen( shouldUpdate, () => subAssign( sw( uv, 'x' ), REC_TRAILS_LENGTH ) );

      assign( tex0, texture( samplerCompute0, uv ) );
      assign( tex1, texture( samplerCompute1, uv ) );

      ifThen( shouldUpdate, () => addAssign( life, REC_TRAILS_LENGTH ) );

    }, () => {
      // -- prepare some vars ----------------------------------------------------------------------
      const seed = texture( samplerRandom, uv );
      init( seed );

      assign( tex0, texture( samplerCompute0, uv ) );
      assign( tex1, texture( samplerCompute1, uv ) );

      const spawnTime = def( 'float', mix(
        0.0,
        TRAILS_SPAWN_LENGTH,
        div( floor( mul( sw( uv, 'y' ), TRAILS_COUNT ) ), TRAILS_COUNT ),
      ) );
      addAssign( spawnTime, glslLofi( time, TRAILS_SPAWN_LENGTH ) );

      ifThen(
        lt( add( sub( time, deltaTime ), TRAILS_SPAWN_LENGTH ), spawnTime ),
        () => subAssign( spawnTime, TRAILS_SPAWN_LENGTH ),
      );

      ifThen( shouldUpdate, () => {
        // -- init particles -----------------------------------------------------------------------
        ifThen( and( lt( sub( time, deltaTime ), spawnTime ), lte( spawnTime, time ) ), () => {
          assign( dt, sub( time, spawnTime ) );

          assign( pos, add(
            mul( 0.1, uniformSphere() ),
            mul( 0.9, sin( mad( vec3( 1.0, 2.0, 3.0 ), vec3( 3.4, 2.5, 3.6 ), time ) ) ),
          ) );
          assign( vel, vec3( 0.0 ) );
          assign( life, 1.0 );
          assign( jumpFlag, 1.0 );
        }, () => {
          assign( jumpFlag, 0.0 ); // remove jump flag
        } );

        // -- update particles ---------------------------------------------------------------------
        // resistance
        mulAssign( vel, exp( mul( -2.0, dt ) ) );

        // noise field
        addAssign( vel, mul(
          8.0,
          dt,
          vec3(
            perlin3d( mad( mad( 0.0, 0.2, time ), 2.0, pos ) ),
            perlin3d( mad( mad( 10.0, 0.2, time ), 2.0, pos ) ),
            perlin3d( mad( mad( 20.0, 0.2, time ), 2.0, pos ) ),
          ),
        ) );

        // succ
        addAssign( vel, mul(
          normalize( pos ),
          min( 0.0, sub( 1.0, length( pos ) ) ),
          8.0,
          dt,
        ) );

        // rotate
        addAssign( vel, mul(
          dt,
          2.0,
          normalize( sw( pos, 'zyx' ) ),
          vec3( -1.0, 0.0, 1.0 ),
        ) );

        // usual update stuff
        addAssign( pos, mul( vel, dt ) );
        assign( life, max( 0.0, sub( life, div( dt, TRAILS_SPAWN_LENGTH ) ) ) );
      } );

    } );

    // -- almost done ------------------------------------------------------------------------------
    addAssign( pos, mul( -0.04, dt ) );

    ifThen( shouldInit, () => assign( jumpFlag, 1.0 ) );

    assign( fragCompute0, tex0 );
    assign( fragCompute1, tex1 );

  } );
} );
