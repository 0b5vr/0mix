import { GRID_RESO } from '../constants';
import { add, assign, build, def, defConst, defInNamed, defOut, defUniformNamed, div, insert, main, neg, sub, sw, vec2, vec4 } from '../../../shaders/shaderBuilder';
import { defFluidSampleNearest3D } from './defFluidSampleNearest3D';
import { fluidClampToGrid } from './fluidClampToGrid';
import { fluidUvToPos } from './fluidUvToPos';

export const fluidPressureFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  const samplerDivergence = defUniformNamed( 'sampler2D', 'samplerDivergence' );
  const samplerPressure = defUniformNamed( 'sampler2D', 'samplerPressure' );

  const sampleNearest3D = defFluidSampleNearest3D();

  const d = defConst( 'vec2', vec2( 0.0, 1.0 / GRID_RESO ) );

  main( () => {
    const pos = def( 'vec3', fluidUvToPos( vUv ) );

    const divergence = sw( sampleNearest3D( samplerDivergence, pos ), 'x' );
    const pressure = def( 'float', (
      div( add(
        sw( sampleNearest3D( samplerPressure, fluidClampToGrid( add( pos, sw( d, 'yxx' ) ) ) ), 'x' ),
        sw( sampleNearest3D( samplerPressure, fluidClampToGrid( sub( pos, sw( d, 'yxx' ) ) ) ), 'x' ),
        sw( sampleNearest3D( samplerPressure, fluidClampToGrid( add( pos, sw( d, 'xyx' ) ) ) ), 'x' ),
        sw( sampleNearest3D( samplerPressure, fluidClampToGrid( sub( pos, sw( d, 'xyx' ) ) ) ), 'x' ),
        sw( sampleNearest3D( samplerPressure, fluidClampToGrid( add( pos, sw( d, 'xxy' ) ) ) ), 'x' ),
        sw( sampleNearest3D( samplerPressure, fluidClampToGrid( sub( pos, sw( d, 'xxy' ) ) ) ), 'x' ),
        neg( divergence )
      ), 6.0 )
    ) );

    assign( fragColor, vec4( pressure, 0.0, 0.0, 1.0 ) );
  } );
} );
