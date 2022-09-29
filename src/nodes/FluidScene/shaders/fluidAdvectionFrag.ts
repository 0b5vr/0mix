import { add, assign, build, def, defInNamed, defOut, defUniformNamed, div, insert, main, mul, sub, sw } from '../../../shaders/shaderBuilder';
import { defFluidSampleLinear3D } from './defFluidSampleLinear3D';
import { defFluidSampleNearest3D } from './defFluidSampleNearest3D';
import { fluidClampToGrid } from './fluidClampToGrid';
import { fluidUvToPos } from './fluidUvToPos';

export const fluidAdvectionFrag: string = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  const deltaTime = defUniformNamed( 'float', 'deltaTime' );
  const dissipation = defUniformNamed( 'float', 'dissipation' );
  const samplerVelocity = defUniformNamed( 'sampler2D', 'samplerVelocity' );
  const samplerSource = defUniformNamed( 'sampler2D', 'samplerSource' );

  const sampleNearest3D = defFluidSampleNearest3D();
  const sampleLinear3D = defFluidSampleLinear3D();

  main( () => {
    const pos = def( 'vec3', fluidUvToPos( vUv ) );

    const vel = sw( sampleNearest3D( samplerVelocity, pos ), 'xyz' );
    const samplePos = fluidClampToGrid( sub( pos, mul( deltaTime, vel ) ) );
    const result = sampleLinear3D( samplerSource, samplePos );

    const decay = add( 1.0, mul( deltaTime, dissipation ) );

    assign( fragColor, div( result, decay ) );
  } );
} );
