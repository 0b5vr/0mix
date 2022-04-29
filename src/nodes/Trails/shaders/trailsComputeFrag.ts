import { add, addAssign, and, assign, build, def, defInNamed, defOut, defUniformNamed, div, exp, floor, gt, ifThen, insert, lt, lte, main, max, mix, mul, mulAssign, sin, sub, subAssign, sw, texture, vec3 } from '../../../shaders/shaderBuilder';
import { cyclicNoise } from '../../../shaders/modules/cyclicNoise';
import { glslDefRandom } from '../../../shaders/modules/glslDefRandom';
import { glslLofi } from '../../../shaders/modules/glslLofi';
import { uniformSphere } from '../../../shaders/modules/uniformSphere';

export const trailsComputeFrag = (
  { trails, trailLength, trailSpawnLength }: {
    trails: number,
    trailLength: number,
    trailSpawnLength: number,
  },
): string => build( () => {
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

    ifThen( gt( sw( uv, 'x' ), 1.0 / trailLength ), () => {
      // -- if it's not head of particles ----------------------------------------------------------
      ifThen( shouldUpdate, () => subAssign( sw( uv, 'x' ), 1.0 / trailLength ) );

      assign( tex0, texture( samplerCompute0, uv ) );
      assign( tex1, texture( samplerCompute1, uv ) );

      ifThen( shouldUpdate, () => addAssign( life, 1.0 / trailLength ) );

    }, () => {
      // -- prepare some vars ----------------------------------------------------------------------
      const seed = texture( samplerRandom, uv );
      init( seed );

      assign( tex0, texture( samplerCompute0, uv ) );
      assign( tex1, texture( samplerCompute1, uv ) );

      const spawnTime = def( 'float', mix(
        0.0,
        trailSpawnLength,
        div( floor( mul( sw( uv, 'y' ), trails ) ), trails ),
      ) );
      addAssign( spawnTime, glslLofi( time, trailSpawnLength ) );

      ifThen(
        lt( add( sub( time, deltaTime ), trailSpawnLength ), spawnTime ),
        () => subAssign( spawnTime, trailSpawnLength ),
      );

      ifThen( shouldUpdate, () => {
        // -- init particles -----------------------------------------------------------------------
        ifThen( and( lt( sub( time, deltaTime ), spawnTime ), lte( spawnTime, time ) ), () => {
          assign( dt, sub( time, spawnTime ) );

          assign( pos, add(
            mul( 0.1, uniformSphere() ),
            mul( 0.3, sin( add( vec3( 1.0, 2.0, 3.0 ), mul( time, vec3( 1.4, 2.5, 3.6 ) ) ) ) ),
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
        const cyclicV = add(
          mul( 1.0, pos ),
          sin( mul( 0.1, time ) ),
        );
        addAssign( vel, mul( 6.0, dt, cyclicNoise( cyclicV, { freq: 1.3 } ) ) );

        // rotate
        addAssign( vel, mul(
          dt,
          sw( pos, 'xzy' ),
          vec3( -1.0, -6.0, 6.0 ),
        ) );

        // usual update stuff
        addAssign( pos, mul( vel, dt ) );
        assign( life, max( 0.0, sub( life, div( dt, trailSpawnLength ) ) ) );
      } );

    } );

    // -- almost done ------------------------------------------------------------------------------
    ifThen( shouldInit, () => assign( jumpFlag, 1.0 ) );

    assign( fragCompute0, tex0 );
    assign( fragCompute1, tex1 );

  } );
} );
