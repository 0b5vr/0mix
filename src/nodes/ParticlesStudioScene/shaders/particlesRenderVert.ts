import { PI } from '../../../utils/constants';
import { add, addAssign, assign, build, def, defIn, defOutNamed, defUniformNamed, divAssign, glPosition, main, mul, pow, sin, sw, texture, vec4 } from '../../../shaders/shaderBuilder';
import { glslSaturate } from '../../../shaders/modules/glslSaturate';
import { rotate2D } from '../../../shaders/modules/rotate2D';

export const particlesRenderVert = build( () => {
  const position = defIn( 'vec3', 0 );
  const normal = defIn( 'vec3', 1 );
  const computeUV = defIn( 'vec2', 3 );

  const vLife = defOutNamed( 'float', 'vLife' );
  const vPositionWithoutModel = defOutNamed( 'vec4', 'vPositionWithoutModel' );
  const vProjPosition = defOutNamed( 'vec4', 'vProjPosition' );
  const vViewPosition = defOutNamed( 'vec4', 'vViewPosition' );
  const vPosition = defOutNamed( 'vec4', 'vPosition' );
  const vNormal = defOutNamed( 'vec3', 'vNormal' );
  const vDice = defOutNamed( 'vec4', 'vDice' );

  const aspect = defUniformNamed( 'float', 'aspect' );
  const projectionMatrix = defUniformNamed( 'mat4', 'projectionMatrix' );
  const viewMatrix = defUniformNamed( 'mat4', 'viewMatrix' );
  const modelMatrix = defUniformNamed( 'mat4', 'modelMatrix' );
  const normalMatrix = defUniformNamed( 'mat3', 'normalMatrix' );
  const samplerRandomStatic = defUniformNamed( 'sampler2D', 'samplerRandomStatic' );
  const samplerCompute0 = defUniformNamed( 'sampler2D', 'samplerCompute0' );

  main( () => {
    // -- fetch texture ----------------------------------------------------------------------------
    const tex0 = texture( samplerCompute0, computeUV );

    // -- assign varying variables -----------------------------------------------------------------
    assign( vDice, texture( samplerRandomStatic, mul( computeUV, 182.92 ) ) );
    assign( vLife, sw( tex0, 'w' ) );

    // -- compute size -----------------------------------------------------------------------------
    assign( vPositionWithoutModel, vec4( sw( tex0, 'xyz' ), 1.0 ) );
    // assign( vPositionWithoutModel, vec4( 0.0, 0.0, 0.0, 1.0 ) );

    const size = mul(
      sin( mul( PI, glslSaturate( vLife ) ) ),
      pow( sw( vDice, 'x' ), 4.0 ),
      0.1,
    );

    const rotYZ = def( 'mat2', (
      rotate2D( mul( 10.0, add( sw( vPositionWithoutModel, 'x' ), sw( vDice, 'z' ) ) ) )
    ) );
    const rotZX = def( 'mat2', (
      rotate2D( mul( 10.0, add( sw( vPositionWithoutModel, 'y' ), sw( vDice, 'w' ) ) ) )
    ) );

    const shape = def( 'vec3', mul( position, size ) );
    assign( sw( shape, 'yz' ), mul( rotYZ, sw( shape, 'yz' ) ) );
    assign( sw( shape, 'zx' ), mul( rotZX, sw( shape, 'zx' ) ) );

    addAssign( sw( vPositionWithoutModel, 'xyz' ), shape );

    // -- compute normals --------------------------------------------------------------------------
    assign( vNormal, normal );
    assign( sw( vNormal, 'yz' ), mul( rotYZ, sw( vNormal, 'yz' ) ) );
    assign( sw( vNormal, 'zx' ), mul( rotZX, sw( vNormal, 'zx' ) ) );
    assign( vNormal, mul( normalMatrix, vNormal ) );

    // -- send the vertex position -----------------------------------------------------------------
    assign( vPosition, mul( modelMatrix, vPositionWithoutModel ) );
    assign( vViewPosition, mul( viewMatrix, vPosition ) );
    assign( vProjPosition, mul( projectionMatrix, vViewPosition ) );
    const outPos = def( 'vec4', vProjPosition );

    divAssign( sw( outPos, 'x' ), aspect );
    assign( glPosition, outPos );
  } );
} );
