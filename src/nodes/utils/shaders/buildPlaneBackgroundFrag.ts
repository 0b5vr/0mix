import { GLSLExpression, assign, build, def, defOut, defUniformNamed, div, glFragCoord, glFragDepth, insert, mad, main, mul, mulAssign, neg, sw, vec4 } from '../../../shaders/shaderBuilder';
import { MTL_UNLIT } from '../../CameraStack/deferredConstants';
import { setupRoRd } from '../../../shaders/modules/setupRoRd';

export type FluidBackgroundDefDrawType = () => (
  ro: GLSLExpression<'vec3'>,
  rd: GLSLExpression<'vec3'>,
) => GLSLExpression<'vec4'>;

export const buildPlaneBackgroundFrag = (
  defDraw: FluidBackgroundDefDrawType,
): string => build( () => {
  insert( 'precision highp float;' );

  const fragColor = defOut( 'vec4' );
  const fragPosition = defOut( 'vec4', 1 );
  const fragNormal = defOut( 'vec4', 2 );
  const fragMisc = defOut( 'vec4', 3 );

  const resolution = defUniformNamed( 'vec2', 'resolution' );
  const cameraNearFar = defUniformNamed( 'vec2', 'cameraNearFar' );

  const draw = defDraw();

  main( () => {
    const p = def( 'vec2', div( sw( glFragCoord, 'xy' ), resolution ) );
    assign( p, mad( -1.0, 2.0, p ) );
    mulAssign( sw( p, 'x' ), div( sw( resolution, 'x' ), sw( resolution, 'y' ) ) );

    const [ ro, rd ] = setupRoRd( p );

    assign( glFragDepth, 0.999 );

    assign( fragColor, draw( ro, rd ) );
    assign( fragPosition, vec4(
      mul( rd, sw( cameraNearFar, 'y' ) ),
      0.999,
    ) );
    assign( fragNormal, vec4( neg( rd ), MTL_UNLIT ) );
    assign( fragMisc, vec4( 0.0 ) );
  } );
} );
