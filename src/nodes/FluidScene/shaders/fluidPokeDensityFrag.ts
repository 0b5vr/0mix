import { abs, addAssign, assign, build, def, defInNamed, defOut, defUniformNamed, insert, length, mad, main, mul, mulAssign, smoothstep, sub, subAssign, sw, vec4 } from '../../../shaders/shaderBuilder';
import { defFluidSampleNearest3D } from './defFluidSampleNearest3D';
import { fluidUvToPos } from './fluidUvToPos';
import { glslSaturate } from '../../../shaders/modules/glslSaturate';
import { rotate2D } from '../../../shaders/modules/rotate2D';

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

    // 冷気
    subAssign( sw( density, 'y' ), mul( 50.0, deltaTime, sw( density, 'w' ) ) );

    mulAssign( sw( pos, 'xy' ), rotate2D( mul( 0.2, time ) ) );
    mulAssign( sw( pos, 'zx' ), rotate2D( mul( 1.7, time ) ) );
    assign( sw( pos, 'x' ), sub( abs( sw( pos, 'x' ) ), 0.3 ) );

    const poke = def( 'float', glslSaturate( mad( -7.0, length( pos ), 1.0 ) ) );
    addAssign( density, mul( deltaTime, mul( poke, vec4( 0.0, 10.0, 0.0, 1.0 ) ) ) );

    addAssign( density, mul(
      deltaTime,
      smoothstep( 0.4, 0.5, sw( pos, 'y' ) ),
      vec4( 0.0, 2.0, 0.0, 0.0 ),
    ) );

    assign( fragColor, density );
  } );
} );
