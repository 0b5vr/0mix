import { GLSLExpression, GLSLToken, add, addAssign, assign, build, def, defIn, defOutNamed, defUniformNamed, div, divAssign, fract, glPointSize, glPosition, length, mad, main, mul, mulAssign, sub, sw, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { PLEXUS_PARTICLES_CBRT } from '../constants';
import { perlin3d } from '../../../shaders/modules/perlin3d';
import { rotate2D } from '../../../shaders/modules/rotate2D';

export const plexusVert = ( isLine?: boolean ): string => build( () => {
  const posId = defIn( 'vec3', 0 );
  const posOpId = defIn( 'vec3', 1 );

  const vPosition = defOutNamed( 'vec4', 'vPosition' );
  const vProjPosition = defOutNamed( 'vec4', 'vProjPosition' );
  const vLength = defOutNamed( 'float', 'vLength' );

  const time = defUniformNamed( 'float', 'time' );
  const aspect = defUniformNamed( 'float', 'aspect' );
  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const projectionMatrix = defUniformNamed( 'mat4', 'projectionMatrix' );
  const viewMatrix = defUniformNamed( 'mat4', 'viewMatrix' );
  const modelMatrix = defUniformNamed( 'mat4', 'modelMatrix' );

  main( () => {
    // -- create local position --------------------------------------------------------------------
    const func = ( pos: GLSLExpression<'vec3'> ): GLSLToken<'vec3'> => {
      const p = def( 'vec3', pos );

      addAssign( p, mul(
        2.0,
        vec3(
          perlin3d( add( mul( 0.01, time ), mul( 0.7, p ) ) ),
          perlin3d( add( mul( 0.01, time ), mul( 0.7, p ), 10.0 ) ),
          perlin3d( add( mul( 0.01, time ), mul( 0.7, p ), 20.0 ) ),
        ),
      ) );

      assign( p, fract( add(
        div( p, PLEXUS_PARTICLES_CBRT - 1.0 ),
        vec3( 0.0, 0.0, mul( 0.1, time ) ),
      ) ) );
      assign( p, mad( vec3( -3.0, -3.0, -6.0 ), 7.0, p ) );
      mulAssign( sw( p, 'xy' ), rotate2D( mul( 0.1, time ) ) );

      return p;
    };

    const pos = func( posId );
    const posOp = func( posOpId );

    const position = def( 'vec4', vec4( pos, 1.0 ) );

    isLine && assign( vLength, length( sub( pos, posOp ) ) );

    // -- send the vertex position -----------------------------------------------------------------
    assign( vPosition, mul( modelMatrix, position ) );
    assign( vProjPosition, mul( projectionMatrix, viewMatrix, vPosition ) );
    const outPos = def( 'vec4', vProjPosition );

    divAssign( sw( outPos, 'x' ), aspect );
    assign( glPosition, outPos );

    assign( glPointSize, mul(
      sw( resolution, 'y' ),
      ( ( projectionMatrix ) + '[0][0]' ) as GLSLExpression<'float'>,
      div( 0.01, sw( glPosition, 'w' ) ),
    ) );
  } );
} );
