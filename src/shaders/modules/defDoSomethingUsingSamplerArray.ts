import { GLSLExpression, arrayIndex, eq, int, ternChain } from '../shaderBuilder';

export const defDoSomethingUsingSamplerArray = <T extends string>(
  samplerArray: GLSLExpression<'sampler2D[]'>,
  arrayLength: number,
) => (
    index: GLSLExpression<'int'>,
    something: ( sampler: GLSLExpression<'sampler2D'> ) => T,
  ): T => (
    ternChain(
      something( arrayIndex( samplerArray, int( 0 ) ) ),
      ...[ ...new Array( arrayLength ) ].map(
        ( _, i ) => [
          eq( index, int( i ) ),
          something( arrayIndex( samplerArray, int( i ) ) ),
        ] as [ GLSLExpression<'bool'>, T ]
      )
    )
  );
