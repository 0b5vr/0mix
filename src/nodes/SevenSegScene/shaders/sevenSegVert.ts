import { GLSLExpression, add, arrayIndex, assign, band, build, def, defConstArray, defIn, defOutNamed, defUniformNamed, divAssign, float, floor, fract, glPosition, int, main, mul, normalize, rshift, sw, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { glslLinearstep } from '../../../shaders/modules/glslLinearstep';
import { glslLofi } from '../../../shaders/modules/glslLofi';
import { normalTransform } from '../../../shaders/modules/normalTransform';
import { pcg3df } from '../../../shaders/modules/pcg3df';

export const sevenSegVert = build( () => {
  const position = defIn( 'vec3', 0 );
  const normal = defIn( 'vec3', 1 );
  const segIds = defIn( 'float', 2 );
  const instanceIds = defIn( 'float', 3 );
  const matrix = defIn( 'mat4', 4 );

  const vPositionWithoutModel = defOutNamed( 'vec4', 'vPositionWithoutModel' );
  const vProjPosition = defOutNamed( 'vec4', 'vProjPosition' );
  const vViewPosition = defOutNamed( 'vec4', 'vViewPosition' );
  const vPosition = defOutNamed( 'vec4', 'vPosition' );
  const vNormalWithoutModel = defOutNamed( 'vec3', 'vNormalWithoutModel' );
  const vNormal = defOutNamed( 'vec3', 'vNormal' );
  const vEmit = defOutNamed( 'float', 'vEmit' );

  const time = defUniformNamed( 'float', 'time' );
  const aspect = defUniformNamed( 'float', 'aspect' );
  const projectionMatrix = defUniformNamed( 'mat4', 'projectionMatrix' );
  const viewMatrix = defUniformNamed( 'mat4', 'viewMatrix' );
  const modelMatrix = defUniformNamed( 'mat4', 'modelMatrix' );

  const segMasks = defConstArray( 'float', [
    1 + 2 + 4 + 8 + 16 + 32, // 0
    2 + 4, // 1
    1 + 2 + 8 + 16 + 64, // 2
    1 + 2 + 4 + 8 + 64, // 3
    2 + 4 + 32 + 64, // 4
    1 + 4 + 8 + 32 + 64, // 5
    1 + 4 + 8 + 16 + 32 + 64, // 6
    1 + 2 + 4, // 7
    1 + 2 + 4 + 8 + 16 + 32 + 64, // 8
    1 + 2 + 4 + 8 + 32 + 64, // 9
    1 + 2 + 4 + 16 + 32 + 64, // A
    4 + 8 + 16 + 32 + 64, // b
    1 + 8 + 16 + 32, // C
    2 + 4 + 8 + 16 + 64, // d
    1 + 8 + 16 + 32 + 64, // E
    1 + 16 + 32 + 64, // F
  ] );

  main( () => {
    assign( vPositionWithoutModel, vec4( position, 1.0 ) );
    assign( vNormalWithoutModel, normalize( normal ) );

    const m = def( 'mat4', mul( modelMatrix, matrix ) );

    assign( vPosition, mul( m, vPositionWithoutModel ) );
    assign( vViewPosition, mul( viewMatrix, vPosition ) );
    assign( vProjPosition, mul( projectionMatrix, vViewPosition ) );
    const outPos = def( 'vec4', vProjPosition );

    divAssign( sw( outPos, 'x' ), aspect );
    assign( glPosition, outPos );

    assign( vNormal, normalTransform( m, normal ) );

    // -- emission ---------------------------------------------------------------------------------
    const y = `${ m }[3][1]` as GLSLExpression<'float'>;
    const phase = def( 'float', add( mul( 140.0 / 120.0, time ), mul( 0.1, y ) ) );
    assign( phase, add( floor( phase ), glslLinearstep( 0.0, 0.3, fract( phase ) ) ) );
    const seed = vec3( glslLofi( phase, 0.1 ), instanceIds, 0.0 );
    const dice = int( mul( pcg3df( seed ), 16.0 ) );
    const segMask = int( arrayIndex( segMasks, dice ) );
    const segFlag = band( rshift( segMask, int( segIds ) ), int( 1.0 ) );
    assign( vEmit, float( segFlag ) );
  } );
} );
