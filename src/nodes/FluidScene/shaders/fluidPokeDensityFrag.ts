import { add, addAssign, assign, build, def, defInNamed, defOut, defUniformNamed, insert, length, main, mul, sin, smoothstep, sw, vec3 } from '../../../shaders/shaderBuilder';
import { defFluidSampleNearest3D } from './defFluidSampleNearest3D';
import { fluidUvToPos } from './fluidUvToPos';

export const fluidPokeDensityFrag: string = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  const time = defUniformNamed( 'float', 'time' );
  const deltaTime = defUniformNamed( 'float', 'deltaTime' );
  const samplerDensity = defUniformNamed( 'sampler2D', 'samplerDensity' );

  const sampleNearest3D = defFluidSampleNearest3D();

  main( () => {
    const pos = def( 'vec3', fluidUvToPos( vUv ) );

    const density = def( 'vec4', sampleNearest3D( samplerDensity, pos ) );

    const l = def( 'float', (
      length( sw( add( pos, mul( 0.0, sin( mul( time, vec3( 0.8, 1.2, 1.7 ) ) ) ) ), 'yz' ) )
    ) );
    const poke = def( 'float', smoothstep( 0.01, 0.0, l ) );
    addAssign( sw( density, 'x' ), mul( 100.0, deltaTime, poke ) );

    assign( fragColor, density );
  } );
} );
