import { assign, build, def, defInNamed, defOut, defUniformNamed, exp, insert, main, mul, sub, sw, vec4 } from '../../../shaders/shaderBuilder';
import { defFluidSampleLinear3D } from './defFluidSampleLinear3D';
import { defFluidSampleNearest3D } from './defFluidSampleNearest3D';
import { fluidClampToGrid } from './fluidClampToGrid';
import { fluidUvToPos } from './fluidUvToPos';

export const fluidAdvectionFrag: string = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  const deltaTime = defUniformNamed( 'float', 'deltaTime' );
  const samplerDensity = defUniformNamed( 'sampler2D', 'samplerDensity' );

  const sampleNearest3D = defFluidSampleNearest3D();
  const sampleLinear3D = defFluidSampleLinear3D();

  main( () => {
    const pos = def( 'vec3', fluidUvToPos( vUv ) );

    const vel = sw( sampleNearest3D( samplerDensity, pos ), 'xyz' );
    const samplePos = fluidClampToGrid( sub( pos, mul( deltaTime, vel ) ) );
    const result = sampleLinear3D( samplerDensity, samplePos );

    const decay = exp( mul( deltaTime, vec4( 0.0, 0.0, 0.0, -2.0 ) ) );

    assign( fragColor, mul( result, decay ) );
  } );
} );
