import { GLSLExpression, abs, add, assign, cache, def, defFn, div, length, lt, mix, mul, mulAssign, retFn, smoothstep, sq, step, sub, subAssign, sw, tern } from '../shaderBuilder';
import { glslLinearstep } from './glslLinearstep';
import { glslSaturate } from './glslSaturate';
import { maxOfVec2 } from './maxOfVec2';

const symbol = Symbol();

export function doShadowMapping(
  tex: GLSLExpression<'vec4'>,
  lenL: GLSLExpression<'float'>,
  dotNL: GLSLExpression<'float'>,
  lightP: GLSLExpression<'vec3'>,
  lightNearFar: GLSLExpression<'vec2'>,
  lightParams: GLSLExpression<'vec4'>,
): GLSLExpression<'float'> {
  const f = cache(
    symbol,
    () => defFn(
      'float',
      [ 'vec4', 'float', 'float', 'vec3', 'vec2', 'vec4' ],
      ( tex, lenL, dotNL, lightP, lightNearFar, lightParams ) => {
        const depth = def( 'float', glslLinearstep(
          sw( lightNearFar, 'x' ),
          sw( lightNearFar, 'y' ),
          lenL,
        ) );
        const lightPXY = sw( lightP, 'xy' );

        const bias = mul( 1E-3, sub( 2.0, dotNL ) );
        subAssign( depth, bias );

        const variance = add(
          glslSaturate( sub( sw( tex, 'y' ), sq( sw( tex, 'x' ) ) ) ),
          1E-3,
        );
        const md = sub( depth, sw( tex, 'x' ) );
        const p = def( 'float', div( variance, add( variance, sq( md ) ) ) );
        assign( p, glslLinearstep( 0.2, 1.0, p ) );

        // edgeclip
        const shadow = def( 'float', mix(
          tern( lt( md, 0.0 ), 1.0, p ),
          1.0,
          smoothstep( 0.8, 1.0, maxOfVec2( abs( lightPXY ) ) ),
        ) );

        // spot
        const spotness = sw( lightParams, 'x' );
        const spotSharpness = sw( lightParams, 'y' );
        mulAssign( shadow, mix(
          1.0,
          mul(
            smoothstep( 1.0, spotSharpness, length( lightPXY ) ),
            step( sw( lightP, 'z' ), 1.0 ),
          ),
          spotness,
        ) );

        retFn( shadow );
      }
    )
  );

  return f( tex, lenL, dotNL, lightP, lightNearFar, lightParams );
}
