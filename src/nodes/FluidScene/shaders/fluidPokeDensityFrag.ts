import { addAssign, assign, build, def, defInNamed, defOut, defUniformNamed, insert, main, mul, step, sw } from '../../../shaders/shaderBuilder';
import { defFluidSampleNearest3D } from './defFluidSampleNearest3D';
import { fluidUvToPos } from './fluidUvToPos';
import { sdtorus } from '../../../shaders/modules/sdtorus';

export const fluidPokeDensityFrag: string = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  const deltaTime = defUniformNamed( 'float', 'deltaTime' );
  const samplerDensity = defUniformNamed( 'sampler2D', 'samplerDensity' );

  const sampleNearest3D = defFluidSampleNearest3D();

  main( () => {
    const pos = def( 'vec3', fluidUvToPos( vUv ) );

    const density = def( 'vec4', sampleNearest3D( samplerDensity, pos ) );

    const l = def( 'float', sdtorus( pos, 0.4, 0.02 ) );
    const poke = def( 'float', step( l, 0.0 ) );
    addAssign( sw( density, 'x' ), mul( 100.0, deltaTime, poke ) );

    assign( fragColor, density );
  } );
} );
