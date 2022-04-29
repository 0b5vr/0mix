import { GLSLExpression, arrayIndex, cache, defUniformArrayNamed, defUniformNamed, forBreak, forLoop, gte, ifThen } from '../shaderBuilder';

const symbol = Symbol();

export const forEachLights: (
  fn: ( params: {
    iLight: GLSLExpression<'int'>,
    lightPos: GLSLExpression<'vec3'>,
    lightColor: GLSLExpression<'vec3'>,
    lightNearFar: GLSLExpression<'vec2'>,
    lightParams: GLSLExpression<'vec4'>,
    lightPV: GLSLExpression<'mat4'>,
  } ) => void,
) => void = ( fn ) => {
  const [
    lightCount,
    arrLightPos,
    arrLightColor,
    arrLightNearFar,
    arrLightParams,
    arrLightPV,
  ] = cache( symbol, () => [
    defUniformNamed( 'int', 'lightCount' ),
    defUniformArrayNamed( 'vec3', 'lightPos', 8 ),
    defUniformArrayNamed( 'vec3', 'lightColor', 8 ),
    defUniformArrayNamed( 'vec2', 'lightNearFar', 8 ),
    defUniformArrayNamed( 'vec4', 'lightParams', 8 ),
    defUniformArrayNamed( 'mat4', 'lightPV', 8 ),
  ] );

  forLoop( 8, ( iLight ) => {
    ifThen( gte( iLight, lightCount ), () => { forBreak(); } );

    fn( {
      iLight,
      lightPos: arrayIndex( arrLightPos, iLight ),
      lightColor: arrayIndex( arrLightColor, iLight ),
      lightNearFar: arrayIndex( arrLightNearFar, iLight ),
      lightParams: arrayIndex( arrLightParams, iLight ),
      lightPV: arrayIndex( arrLightPV, iLight ),
    } );
  } );
};
