import { genToken, insertTop } from '../shaderBuilder';

export function defineFs():
( x: string ) => string {
  const token = genToken();
  insertTop( `\n#define ${ token }(x) fract(sin((x)*114.514)*1919.810)\n` );
  return ( x ) => `(${ token }(${ x }))`;
}
