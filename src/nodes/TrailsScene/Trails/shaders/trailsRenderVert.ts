import { REC_TRAILS_LENGTH } from '../constants';
import { addAssign, assign, build, def, defIn, defOutNamed, defUniformNamed, divAssign, glPosition, mad, main, mix, mul, step, sub, sw, texture, vec2, vec3, vec4 } from '../../../../shaders/shaderBuilder';
import { orthBas } from '../../../../shaders/modules/orthBas';

export const trailsRenderVert: string = build( () => {
  const position = defIn( 'vec3', 0 );
  const normal = defIn( 'vec3', 1 );
  const computeV = defIn( 'float', 3 );

  const vLife = defOutNamed( 'float', 'vLife' );
  const vPositionWithoutModel = defOutNamed( 'vec4', 'vPositionWithoutModel' );
  const vProjPosition = defOutNamed( 'vec4', 'vProjPosition' );
  const vViewPosition = defOutNamed( 'vec4', 'vViewPosition' );
  const vPosition = defOutNamed( 'vec4', 'vPosition' );
  const vNormal = defOutNamed( 'vec3', 'vNormal' );
  const vDice = defOutNamed( 'vec4', 'vDice' );
  const vJumpFlag = defOutNamed( 'float', 'vJumpFlag' );

  const aspect = defUniformNamed( 'float', 'aspect' );
  const projectionMatrix = defUniformNamed( 'mat4', 'projectionMatrix' );
  const viewMatrix = defUniformNamed( 'mat4', 'viewMatrix' );
  const modelMatrix = defUniformNamed( 'mat4', 'modelMatrix' );
  const normalMatrix = defUniformNamed( 'mat3', 'normalMatrix' );
  const samplerRandomStatic = defUniformNamed( 'sampler2D', 'samplerRandomStatic' );
  const samplerCompute0 = defUniformNamed( 'sampler2D', 'samplerCompute0' );
  const samplerCompute1 = defUniformNamed( 'sampler2D', 'samplerCompute1' );

  main( () => {
    // -- fetch texture ----------------------------------------------------------------------------
    const computeUV = vec2(
      mix( 0.5, sub( 1.0, 0.5 * REC_TRAILS_LENGTH ), sw( position, 'z' ) ),
      computeV,
    );
    const tex0 = texture( samplerCompute0, computeUV );
    const tex1 = texture( samplerCompute1, computeUV );

    // -- assign varying variables -----------------------------------------------------------------
    assign( vDice, texture( samplerRandomStatic, vec2( mul( computeV, 182.92 ) ) ) );
    assign( vLife, sw( tex0, 'w' ) );
    assign( vJumpFlag, sw( tex1, 'w' ) );

    // -- compute size -----------------------------------------------------------------------------
    assign( vPositionWithoutModel, vec4( sw( tex0, 'xyz' ), 1.0 ) );
    // assign( vPositionWithoutModel, vec4( 0.0, 0.0, 0.0, 1.0 ) );

    const size = mad( 0.004, sw( vDice, 'x' ), 0.001 );

    addAssign( vJumpFlag, step( size, 1E-4 ) ); // utilizing the jump flag

    const b = orthBas( sw( tex1, 'xyz' ) );

    const shape = def( 'vec3', mul( vec3( 1, 1, 0 ), position, size ) );
    assign( shape, mul( b, shape ) );

    addAssign( sw( vPositionWithoutModel, 'xyz' ), shape );

    // -- compute normals --------------------------------------------------------------------------
    assign( vNormal, mul( normalMatrix, b, normal ) );

    // -- send the vertex position -----------------------------------------------------------------
    assign( vPosition, mul( modelMatrix, vPositionWithoutModel ) );
    assign( vViewPosition, mul( viewMatrix, vPosition ) );
    assign( vProjPosition, mul( projectionMatrix, vViewPosition ) );
    const outPos = def( 'vec4', vProjPosition );

    divAssign( sw( outPos, 'x' ), aspect );
    assign( glPosition, outPos );
  } );
} );
