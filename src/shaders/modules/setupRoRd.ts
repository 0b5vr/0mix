import { GLSLExpression, GLSLToken, def, defFn, defUniformNamed, div, mul, normalize, retFn, sub, sw, vec4 } from '../shaderBuilder';

export function setupRoRd( p: GLSLExpression<'vec2'> ): [
  ro: GLSLToken<'vec3'>,
  rd: GLSLToken<'vec3'>,
] {
  const inversePVM = defUniformNamed( 'mat4', 'inversePVM' );

  const divideByW = defFn( 'vec3', [ 'vec4' ], ( v ) => {
    retFn( div( sw( v, 'xyz' ), sw( v, 'w' ) ) );
  } );

  const ro = def( 'vec3', divideByW( mul( inversePVM, vec4( p, 0.0, 1.0 ) ) ) );
  const farPos = def( 'vec3', divideByW( mul( inversePVM, vec4( p, 1.0, 1.0 ) ) ) );

  return [
    ro,
    def( 'vec3', normalize( sub( farPos, ro ) ) ), // rd
  ];
}
