import { GRID_RESO } from '../constants';
import { add, assign, build, def, defConst, defInNamed, defOut, defUniformNamed, insert, main, neg, sub, sw, vec2, vec4 } from '../../../shaders/shaderBuilder';
import { defFluidSampleNearest3D } from './defFluidSampleNearest3D';
import { fluidClampToGrid } from './fluidClampToGrid';
import { fluidUvToPos } from './fluidUvToPos';

export const fluidCurlFrag: string = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  const samplerVelocity = defUniformNamed( 'sampler2D', 'samplerVelocity' );

  const sampleNearest3D = defFluidSampleNearest3D();

  const d = defConst( 'vec2', vec2( 0.0, 1.0 / GRID_RESO ) );

  main( () => {
    const pos = def( 'vec3', fluidUvToPos( vUv ) );

    const nx = def( 'vec4', sampleNearest3D( samplerVelocity, fluidClampToGrid( sub( pos, sw( d, 'yxx' ) ) ) ) );
    const px = def( 'vec4', sampleNearest3D( samplerVelocity, fluidClampToGrid( add( pos, sw( d, 'yxx' ) ) ) ) );
    const ny = def( 'vec4', sampleNearest3D( samplerVelocity, fluidClampToGrid( sub( pos, sw( d, 'xyx' ) ) ) ) );
    const py = def( 'vec4', sampleNearest3D( samplerVelocity, fluidClampToGrid( add( pos, sw( d, 'xyx' ) ) ) ) );
    const nz = def( 'vec4', sampleNearest3D( samplerVelocity, fluidClampToGrid( sub( pos, sw( d, 'xxy' ) ) ) ) );
    const pz = def( 'vec4', sampleNearest3D( samplerVelocity, fluidClampToGrid( add( pos, sw( d, 'xxy' ) ) ) ) );

    assign( fragColor, vec4(
      add( sw( nz, 'y' ), sw( py, 'z' ), neg( sw( pz, 'y' ) ), neg( sw( ny, 'z' ) ) ),
      add( sw( nx, 'z' ), sw( pz, 'x' ), neg( sw( px, 'z' ) ), neg( sw( nz, 'x' ) ) ),
      add( sw( ny, 'x' ), sw( px, 'y' ), neg( sw( py, 'x' ) ), neg( sw( nx, 'y' ) ) ),
      1.0
    ) );
  } );
} );
