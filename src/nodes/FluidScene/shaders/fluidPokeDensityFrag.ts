import { add, addAssign, assign, build, def, defInNamed, defOut, defUniformNamed, insert, main, mul, step, sub, subAssign, sw, vec3 } from '../../../shaders/shaderBuilder';
import { defFluidSampleNearest3D } from './defFluidSampleNearest3D';
import { fluidUvToPos } from './fluidUvToPos';
import { glslLofir } from '../../../shaders/modules/glslLofir';
import { sdcapsule } from '../../../shaders/modules/sdcapsule';

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

    subAssign( sw( pos, 'y' ), glslLofir( sw( pos, 'y' ), 0.08 ) );

    const d = def( 'float', sdcapsule( add( pos, vec3( 0.4, 0.0, 0.0 ) ), vec3( 0.8, 0.0, 0.0 ) ) );

    const l = def( 'float', sub( d, 0.005 ) );
    const poke = def( 'float', step( l, 0.0 ) );
    addAssign( sw( density, 'x' ), mul( 1.0, deltaTime, poke ) );

    assign( fragColor, density );
  } );
} );
