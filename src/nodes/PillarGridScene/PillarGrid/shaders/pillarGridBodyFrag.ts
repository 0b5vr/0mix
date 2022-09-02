import { MTL_PBR_ROUGHNESS_METALLIC } from '../../../CameraStack/deferredConstants';
import { addAssign, def, floor, length, mad, mul, mulAssign, retFn, sub, unrollLoop, vec3 } from '../../../../shaders/shaderBuilder';
import { assign, build, defInNamed, defOut, defUniformNamed, div, insert, main, normalize, sw, vec4 } from '../../../../shaders/shaderBuilder';
import { calcShadowDepth } from '../../../../shaders/modules/calcShadowDepth';
import { glslLofir } from '../../../../shaders/modules/glslLofir';
import { pcg3df } from '../../../../shaders/modules/pcg3df';

export const pillarGridBodyFrag = ( tag: 'deferred' | 'depth' ): string => build( () => {
  insert( 'precision highp float;' );

  const vPosition = defInNamed( 'vec4', 'vPosition' );
  const vProjPosition = defInNamed( 'vec4', 'vProjPosition' );
  const vNormal = defInNamed( 'vec3', 'vNormal' );
  const vNoiseCoord = defInNamed( 'vec3', 'vNoiseCoord' );

  const fragColor = defOut( 'vec4' );
  const fragPosition = defOut( 'vec4', 1 );
  const fragNormal = defOut( 'vec4', 2 );
  const fragMisc = defOut( 'vec4', 3 );

  const cameraPos = defUniformNamed( 'vec3', 'cameraPos' );
  const cameraNearFar = defUniformNamed( 'vec2', 'cameraNearFar' );

  main( () => {
    if ( tag === 'depth' ) {
      const posXYZ = sw( vPosition, 'xyz' );

      const len = length( sub( cameraPos, posXYZ ) );
      assign( fragColor, calcShadowDepth( cameraNearFar, len ) );
      retFn();

    }

    const depth = div( sw( vProjPosition, 'z' ), sw( vProjPosition, 'w' ) );

    const roughness = def( 'float', 0.0 );
    const p = def( 'vec3', vNoiseCoord );
    const v = def( 'vec3', vec3( 0.0 ) );

    unrollLoop( 8, () => {
      const dice = def( 'vec3', pcg3df( floor( p ) ) );
      addAssign( v, dice );
      assign( p, mad( glslLofir( mul( 1.3, p ), 0.01 ), dice, 2.0 ) );
    } );

    assign( roughness, div( sw( v, 'x' ), 8.0 ) );
    mulAssign( roughness, roughness );

    assign( fragColor, vec4( 0.02, 0.02, 0.02, 1.0 ) );
    assign( fragPosition, vec4( sw( vPosition, 'xyz' ), depth ) );
    assign( fragNormal, vec4( normalize( vNormal ), MTL_PBR_ROUGHNESS_METALLIC ) );
    assign( fragMisc, vec4( roughness, 0.0, 0.0, 0.0 ) );
    return;
  } );
} );

