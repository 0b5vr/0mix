import { GRID_RESO } from '../constants';
import { add, assign, build, def, defConst, defInNamed, defOut, defUniformNamed, div, gt, ifThen, insert, lt, main, neg, sub, sw, vec2, vec4 } from '../../../shaders/shaderBuilder';
import { defFluidSampleNearest3D } from './defFluidSampleNearest3D';
import { fluidClampToGrid } from './fluidClampToGrid';
import { fluidUvToPos } from './fluidUvToPos';

export const fluidDivergenceFrag: string = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  const samplerDensity = defUniformNamed( 'sampler2D', 'samplerDensity' );

  const sampleNearest3D = defFluidSampleNearest3D();

  const d = defConst( 'vec2', vec2( 0.0, 1.0 / GRID_RESO ) );

  main( () => {
    const pos = def( 'vec3', fluidUvToPos( vUv ) );

    const v = def( 'vec3', sw( sampleNearest3D( samplerDensity, pos ), 'xyz' ) );
    const nx = def( 'float', sw( sampleNearest3D( samplerDensity, fluidClampToGrid( sub( pos, sw( d, 'yxx' ) ) ) ), 'x' ) );
    const px = def( 'float', sw( sampleNearest3D( samplerDensity, fluidClampToGrid( add( pos, sw( d, 'yxx' ) ) ) ), 'x' ) );
    const ny = def( 'float', sw( sampleNearest3D( samplerDensity, fluidClampToGrid( sub( pos, sw( d, 'xyx' ) ) ) ), 'y' ) );
    const py = def( 'float', sw( sampleNearest3D( samplerDensity, fluidClampToGrid( add( pos, sw( d, 'xyx' ) ) ) ), 'y' ) );
    const nz = def( 'float', sw( sampleNearest3D( samplerDensity, fluidClampToGrid( sub( pos, sw( d, 'xxy' ) ) ) ), 'z' ) );
    const pz = def( 'float', sw( sampleNearest3D( samplerDensity, fluidClampToGrid( add( pos, sw( d, 'xxy' ) ) ) ), 'z' ) );

    const maxBound = sub( 0.5, div( 1.0, GRID_RESO ) );
    const minBound = neg( maxBound );

    ifThen( lt( sw( pos, 'x' ), minBound ), () => assign( nx, neg( sw( v, 'x' ) ) ) );
    ifThen( gt( sw( pos, 'x' ), maxBound ), () => assign( px, neg( sw( v, 'x' ) ) ) );
    ifThen( lt( sw( pos, 'y' ), minBound ), () => assign( ny, neg( sw( v, 'y' ) ) ) );
    ifThen( gt( sw( pos, 'y' ), maxBound ), () => assign( py, neg( sw( v, 'y' ) ) ) );
    ifThen( lt( sw( pos, 'z' ), minBound ), () => assign( nz, neg( sw( v, 'z' ) ) ) );
    ifThen( gt( sw( pos, 'z' ), maxBound ), () => assign( pz, neg( sw( v, 'z' ) ) ) );

    const divergence = div( add( px, neg( nx ), py, neg( ny ), pz, neg( nz ) ), 3.0 );
    assign( fragColor, vec4( divergence, 0.0, 0.0, 1.0 ) );
  } );
} );
