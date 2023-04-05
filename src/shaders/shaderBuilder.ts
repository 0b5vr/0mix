import { arraySerial } from '@0b5vr/experimental';

export type GLSLExpression<T extends string> = string & {
  __type: T,
  __glslExpression: true,
};
export type GLSLFloatExpression = GLSLExpression<'float'> | number;
export type GLSLToken<T extends string = string> = string & {
  __type: T,
  __glslExpression: true,
  __glslToken: true,
};

export type GLSLGenType = 'float' | 'vec2' | 'vec3' | 'vec4';

type Ex<T extends string> = GLSLExpression<T>;
type Exf = GLSLFloatExpression;
type Tok<T extends string> = GLSLToken<T>;

export type SwizzleComponentVec1 = 'x' | 'r' | 's';
export type SwizzleComponentVec2 = SwizzleComponentVec1 | 'y' | 'g' | 't';
export type SwizzleComponentVec3 = SwizzleComponentVec2 | 'z' | 'b' | 'p';
export type SwizzleComponentVec4 = SwizzleComponentVec3 | 'w' | 'a' | 'q';
export type Swizzle2ComponentsVec1 = `${ SwizzleComponentVec1 }${ SwizzleComponentVec1 }`;
export type Swizzle3ComponentsVec1 = `${ Swizzle2ComponentsVec1 }${ SwizzleComponentVec1 }`;
export type Swizzle4ComponentsVec1 = `${ Swizzle3ComponentsVec1 }${ SwizzleComponentVec1 }`;
export type Swizzle2ComponentsVec2 = `${ SwizzleComponentVec2 }${ SwizzleComponentVec2 }`;
export type Swizzle3ComponentsVec2 = `${ Swizzle2ComponentsVec2 }${ SwizzleComponentVec2 }`;
export type Swizzle4ComponentsVec2 = `${ Swizzle3ComponentsVec2 }${ SwizzleComponentVec2 }`;
export type Swizzle2ComponentsVec3 = `${ SwizzleComponentVec3 }${ SwizzleComponentVec3 }`;
export type Swizzle3ComponentsVec3 = `${ Swizzle2ComponentsVec3 }${ SwizzleComponentVec3 }`;
export type Swizzle4ComponentsVec3 = `${ Swizzle3ComponentsVec3 }${ SwizzleComponentVec3 }`;
export type Swizzle2ComponentsVec4 = `${ SwizzleComponentVec4 }${ SwizzleComponentVec4 }`;
export type Swizzle3ComponentsVec4 = `${ Swizzle2ComponentsVec4 }${ SwizzleComponentVec4 }`;
export type Swizzle4ComponentsVec4 = `${ Swizzle3ComponentsVec4 }${ SwizzleComponentVec4 }`;

// since booleans are compiled into 0 and 1 in terser
export const glslFalse = 'false' as GLSLExpression<'bool'>;
export const glslTrue = 'true' as GLSLExpression<'bool'>;

// †† the sacred zone of global state ††††††††††††††††††††††††††††††††††††††††††††††††††††††††††††††
const __stack: string[] = [];

const __cache: Map<string | symbol, any> = new Map();

let __charIndex = 0;
// †† end of the sacred zone of global state †††††††††††††††††††††††††††††††††††††††††††††††††††††††

export function genToken(): string {
  let i = __charIndex;
  let token = '_';
  do {
    token += String.fromCharCode( 97 + ( i % 26 ) );
    i = ( i / 26 ) | 0;
  } while ( i > 0 );
  __charIndex ++;
  return token;
}

export function cache<T>( id: string | symbol, create: () => T ): T {
  let func = __cache.get( id ) as T | undefined;
  if ( func == null ) {
    func = create();
    __cache.set( id, func );
  }
  return func;
}

export const glPosition = 'gl_Position' as Tok<'vec4'>;
export const glPointSize = 'gl_PointSize' as Tok<'float'>;
export const glPointCoord = 'gl_PointCoord' as Tok<'vec2'>;
export const glFragCoord = 'gl_FragCoord' as Tok<'vec4'>;
export const glFragColor = 'gl_FragColor' as Tok<'vec4'>;
export const glFragDepth = 'gl_FragDepth' as Tok<'float'>;
export const glFrontFacing = 'gl_FrontFacing' as Tok<'bool'>;

export function insert( code: string ): void {
  __stack[ 0 ] += code;
}

export function insertTop( code: string ): void {
  __stack[ __stack.length - 1 ] += code;
}

export function num( val: GLSLFloatExpression ): GLSLExpression<'float'>;
export function num( val: string | number ): string;
export function num( val: string | number ): string {
  if ( typeof val !== 'number' ) {
    return `${ val }`;
  }

  let str: string = val.toString( 10 );
  if ( str.indexOf( '.' ) === -1 ) {
    str += '.';
  }
  return `(${ str })`;
}

function __def( { type, init, initArray, location, name, modifier, local, size }: {
  type: string,
  init?: string | number,
  initArray?: ( string | number )[],
  location?: number,
  name?: string,
  modifier?: string,
  local?: boolean,
  size?: number,
} ): string {
  const token = name ?? genToken();

  ( local ? insert : insertTop )( [
    location != null ? `layout (location=${ location })` : '',
    modifier ?? '',
    type ?? '',
    token,
    size != null ? `[${ size }]` : '',
    init != null ? `=${ num( init ) }` : '',
    initArray != null ? `=${ type }[](${ initArray.map( ( v ) => num( v ) ).join( ',' ) })` : '',
    ';',
  ].join( ' ' ) );

  return token;
}

export const def: {
  ( type: 'float', init?: Exf ): Tok<'float'>;
  <T extends string>( type: T, init?: Ex<T> ): Tok<T>;
} = ( type: string, init?: string | number ) => __def( {
  type,
  init,
  local: true,
} ) as any;

export const defGlobal: {
  ( type: 'float', init?: Exf ): Tok<'float'>;
  <T extends string>( type: T, init?: Ex<T> ): Tok<T>;
} = ( type: string, init?: string | number ) => __def( {
  type,
  init,
} ) as any;

export const defConst: {
  ( type: 'float', init?: Exf ): Tok<'float'>;
  <T extends string>( type: T, init?: Ex<T> ): Tok<T>;
} = ( type: string, init?: string | number ) => __def( {
  type,
  init,
  modifier: 'const',
} ) as any;

export const defConstArray: {
  ( type: 'float', initArray: Exf[] ): Tok<'float[]'>;
  <T extends string>( type: T, initArray: Ex<T>[] ): Tok<`${ T }[]`>;
} = ( type: string, initArray: ( string | number )[] ) => __def( {
  type,
  initArray,
  size: initArray.length,
  modifier: 'const',
} ) as any;

export const defIn: {
  <T extends string>( type: T, location?: number ): Tok<T>;
} = ( type: string, location = 0 ) => __def( {
  type,
  location,
  modifier: 'in',
} ) as any;

export const defInNamed: {
  <T extends string>( type: T, name: string ): Tok<T>;
} = ( type: string, name: string ) => cache(
  name,
  () => __def( {
    type,
    name,
    modifier: 'in',
  } ) as any,
);

export const defOut: {
  <T extends string>( type: T, location?: number ): Tok<T>;
} = ( type: string, location = 0 ) => __def( {
  type,
  location,
  modifier: 'out',
} ) as any;

export const defOutNamed: {
  <T extends string>( type: T, name: string ): Tok<T>;
} = ( type: string, name: string ) => __def( {
  type,
  name,
  modifier: 'out',
} ) as any;

export const defUniformNamed: {
  <T extends string>( type: T, name: string ): Tok<T>;
} = ( type: string, name: string ) => cache(
  name,
  () => __def( {
    type,
    name,
    modifier: 'uniform',
  } ) as any,
);

export const defUniformArrayNamed: {
  <T extends string>( type: T, name: string, size: number ): Tok<`${ T }[]`>;
} = ( type: string, name: string, size: number ) => cache(
  name,
  () => __def( {
    type,
    name,
    modifier: 'uniform',
    size,
  } ) as any,
);

export const assign: {
  ( dst: Tok<'float'>, src: number ): void;
  <T extends string>( dst: Tok<T>, src: Ex<T> ): void;
} = ( dst: string, src: string | number ) => (
  insert( `${dst}=${num( src )};` )
);

export const addAssign: {
  ( dst: Tok<'float'>, src: Exf ): void;
  ( dst: Tok<'vec2'>, src: Exf | Ex<'vec2'> ): void;
  ( dst: Tok<'vec3'>, src: Exf | Ex<'vec3'> ): void;
  ( dst: Tok<'vec4'>, src: Exf | Ex<'vec4'> ): void;
  ( dst: Tok<'int'>, src: Ex<'int'> ): void;
  ( dst: Tok<'ivec2'>, src: Exf | Ex<'ivec2'> ): void;
  ( dst: Tok<'ivec3'>, src: Exf | Ex<'ivec3'> ): void;
  ( dst: Tok<'ivec4'>, src: Exf | Ex<'ivec4'> ): void;
  ( dst: Tok<'uint'>, src: Ex<'uint'> ): void;
  ( dst: Tok<'uvec2'>, src: Ex<'uint'> | Ex<'uvec2'> ): void;
  ( dst: Tok<'uvec3'>, src: Ex<'uint'> | Ex<'uvec3'> ): void;
  ( dst: Tok<'uvec4'>, src: Ex<'uint'> | Ex<'uvec4'> ): void;
} = ( dst: string, src: string | number ) => (
  insert( `${dst}+=${num( src )};` )
);

export const subAssign: {
  ( dst: Tok<'float'>, src: Exf ): void;
  ( dst: Tok<'vec2'>, src: Exf | Ex<'vec2'> ): void;
  ( dst: Tok<'vec3'>, src: Exf | Ex<'vec3'> ): void;
  ( dst: Tok<'vec4'>, src: Exf | Ex<'vec4'> ): void;
  ( dst: Tok<'int'>, src: Ex<'int'> ): void;
  ( dst: Tok<'ivec2'>, src: Exf | Ex<'ivec2'> ): void;
  ( dst: Tok<'ivec3'>, src: Exf | Ex<'ivec3'> ): void;
  ( dst: Tok<'ivec4'>, src: Exf | Ex<'ivec4'> ): void;
  ( dst: Tok<'uint'>, src: Ex<'uint'> ): void;
  ( dst: Tok<'uvec2'>, src: Ex<'uint'> | Ex<'uvec2'> ): void;
  ( dst: Tok<'uvec3'>, src: Ex<'uint'> | Ex<'uvec3'> ): void;
  ( dst: Tok<'uvec4'>, src: Ex<'uint'> | Ex<'uvec4'> ): void;
} = ( dst: string, src: string | number ) => (
  insert( `${dst}-=${num( src )};` )
);

export const mulAssign: {
  ( dst: Tok<'float'>, src: Exf ): void;
  ( dst: Tok<'vec2'>, src: Exf | Ex<'vec2'> | Ex<'mat2'> ): void;
  ( dst: Tok<'vec3'>, src: Exf | Ex<'vec3'> | Ex<'mat3'> ): void;
  ( dst: Tok<'vec4'>, src: Exf | Ex<'vec4'> | Ex<'mat4'> ): void;
  ( dst: Tok<'uint'>, src: Ex<'uint'> ): void;
  ( dst: Tok<'uvec2'>, src: Ex<'uint'> | Ex<'uvec2'> ): void;
  ( dst: Tok<'uvec3'>, src: Ex<'uint'> | Ex<'uvec3'> ): void;
  ( dst: Tok<'uvec4'>, src: Ex<'uint'> | Ex<'uvec4'> ): void;
} = ( dst: string, src: string | number ) => (
  insert( `${dst}*=${num( src )};` )
);

export const divAssign: {
  ( dst: Tok<'float'>, src: Exf ): void;
  ( dst: Tok<'vec2'>, src: Exf | Ex<'vec2'> ): void;
  ( dst: Tok<'vec3'>, src: Exf | Ex<'vec3'> ): void;
  ( dst: Tok<'vec4'>, src: Exf | Ex<'vec4'> ): void;
  ( dst: Tok<'uint'>, src: Ex<'uint'> ): void;
  ( dst: Tok<'uvec2'>, src: Ex<'uint'> | Ex<'uvec2'> ): void;
  ( dst: Tok<'uvec3'>, src: Ex<'uint'> | Ex<'uvec3'> ): void;
  ( dst: Tok<'uvec4'>, src: Ex<'uint'> | Ex<'uvec4'> ): void;
} = ( dst: string, src: string | number ) => (
  insert( `${dst}/=${num( src )};` )
);

export const lshiftAssign: {
  ( dst: Tok<'uint'>, src: Ex<'uint'> ): void;
  ( dst: Tok<'uvec2'>, src: Ex<'uint'> | Ex<'uvec2'> ): void;
  ( dst: Tok<'uvec3'>, src: Ex<'uint'> | Ex<'uvec3'> ): void;
  ( dst: Tok<'uvec4'>, src: Ex<'uint'> | Ex<'uvec4'> ): void;
} = ( dst: string, src: string ) => (
  insert( `${dst}<<=${src};` )
);

export const rshiftAssign: {
  ( dst: Tok<'uint'>, src: Ex<'uint'> ): void;
  ( dst: Tok<'uvec2'>, src: Ex<'uint'> | Ex<'uvec2'> ): void;
  ( dst: Tok<'uvec3'>, src: Ex<'uint'> | Ex<'uvec3'> ): void;
  ( dst: Tok<'uvec4'>, src: Ex<'uint'> | Ex<'uvec4'> ): void;
} = ( dst: string, src: string ) => (
  insert( `${dst}>>=${src};` )
);

export const xorAssign: {
  ( dst: Tok<'uint'>, src: Ex<'uint'> ): void;
  ( dst: Tok<'uvec2'>, src: Ex<'uint'> | Ex<'uvec2'> ): void;
  ( dst: Tok<'uvec3'>, src: Ex<'uint'> | Ex<'uvec3'> ): void;
  ( dst: Tok<'uvec4'>, src: Ex<'uint'> | Ex<'uvec4'> ): void;
} = ( dst: string, src: string ) => (
  insert( `${dst}^=${src};` )
);

export const add: {
  ( ...args: Exf[] ): Ex<'float'>;
  // <T extends GLSLGenType>( ...args: ( Exf | Ex<T> )[] ): Ex<T>; // does not work well with spread
  ( ...args: ( Exf | Ex<'vec2'> )[] ): Ex<'vec2'>;
  ( ...args: ( Exf | Ex<'vec3'> )[] ): Ex<'vec3'>;
  ( ...args: ( Exf | Ex<'vec4'> )[] ): Ex<'vec4'>;
  ( ...args: ( Ex<'int'> )[] ): Ex<'int'>;
  ( ...args: ( Ex<'int'> | Ex<'ivec2'> )[] ): Ex<'ivec2'>;
  ( ...args: ( Ex<'int'> | Ex<'ivec3'> )[] ): Ex<'ivec3'>;
  ( ...args: ( Ex<'int'> | Ex<'ivec4'> )[] ): Ex<'ivec4'>;
  ( ...args: ( Ex<'uint'> )[] ): Ex<'uint'>;
  ( ...args: ( Ex<'uint'> | Ex<'uvec2'> )[] ): Ex<'uvec2'>;
  ( ...args: ( Ex<'uint'> | Ex<'uvec3'> )[] ): Ex<'uvec3'>;
  ( ...args: ( Ex<'uint'> | Ex<'uvec4'> )[] ): Ex<'uvec4'>;
} = ( ...args: ( string | number )[] ) => (
  `(${args.map( ( arg ) => num( arg ) ).join( '+' )})`
) as any;

export const sub: {
  ( ...args: Exf[] ): Ex<'float'>;
  // <T extends GLSLGenType>( ...args: ( Exf | Ex<T> )[] ): Ex<T>; // does not work well with spread
  ( ...args: ( Exf | Ex<'vec2'> )[] ): Ex<'vec2'>;
  ( ...args: ( Exf | Ex<'vec3'> )[] ): Ex<'vec3'>;
  ( ...args: ( Exf | Ex<'vec4'> )[] ): Ex<'vec4'>;
  ( ...args: ( Ex<'int'> )[] ): Ex<'int'>;
  ( ...args: ( Ex<'int'> | Ex<'ivec2'> )[] ): Ex<'ivec2'>;
  ( ...args: ( Ex<'int'> | Ex<'ivec3'> )[] ): Ex<'ivec3'>;
  ( ...args: ( Ex<'int'> | Ex<'ivec4'> )[] ): Ex<'ivec4'>;
  ( ...args: ( Ex<'uint'> )[] ): Ex<'uint'>;
  ( ...args: ( Ex<'uint'> | Ex<'uvec2'> )[] ): Ex<'uvec2'>;
  ( ...args: ( Ex<'uint'> | Ex<'uvec3'> )[] ): Ex<'uvec3'>;
  ( ...args: ( Ex<'uint'> | Ex<'uvec4'> )[] ): Ex<'uvec4'>;
} = ( ...args: ( string | number )[] ) => (
  `(${args.map( ( arg ) => num( arg ) ).join( '-' )})`
) as any;

export const mul: {
  ( ...args: Exf[] ): Ex<'float'>;
  // <T extends GLSLGenType>( ...args: ( Exf | Ex<T> )[] ): Ex<T>; // does not work well with spread
  ( ...args: ( Ex<'mat4'> )[] ): Ex<'mat4'>;
  ( ...args: ( Ex<'mat3'> )[] ): Ex<'mat3'>;
  ( ...args: ( Ex<'mat2'> )[] ): Ex<'mat2'>;
  ( ...args: ( Exf | Ex<'vec2'> | Ex<'mat2'> )[] ): Ex<'vec2'>;
  ( ...args: ( Exf | Ex<'vec3'> | Ex<'mat3'> )[] ): Ex<'vec3'>;
  ( ...args: ( Exf | Ex<'vec4'> | Ex<'mat4'> )[] ): Ex<'vec4'>;
  ( ...args: ( Ex<'int'> )[] ): Ex<'int'>;
  ( ...args: ( Ex<'int'> | Ex<'ivec2'> )[] ): Ex<'ivec2'>;
  ( ...args: ( Ex<'int'> | Ex<'ivec3'> )[] ): Ex<'ivec3'>;
  ( ...args: ( Ex<'int'> | Ex<'ivec4'> )[] ): Ex<'ivec4'>;
  ( ...args: ( Ex<'uint'> )[] ): Ex<'uint'>;
  ( ...args: ( Ex<'uint'> | Ex<'uvec2'> )[] ): Ex<'uvec2'>;
  ( ...args: ( Ex<'uint'> | Ex<'uvec3'> )[] ): Ex<'uvec3'>;
  ( ...args: ( Ex<'uint'> | Ex<'uvec4'> )[] ): Ex<'uvec4'>;
} = ( ...args: ( string | number )[] ) => (
  `(${args.map( ( arg ) => num( arg ) ).join( '*' )})`
) as any;

export const div: {
  ( ...args: Exf[] ): Ex<'float'>;
  // <T extends GLSLGenType>( ...args: ( Exf | Ex<T> )[] ): Ex<T>; // does not work well with spread
  ( ...args: ( Exf | Ex<'vec2'> )[] ): Ex<'vec2'>;
  ( ...args: ( Exf | Ex<'vec3'> )[] ): Ex<'vec3'>;
  ( ...args: ( Exf | Ex<'vec4'> )[] ): Ex<'vec4'>;
  ( ...args: ( Ex<'int'> )[] ): Ex<'int'>;
  ( ...args: ( Ex<'int'> | Ex<'ivec2'> )[] ): Ex<'ivec2'>;
  ( ...args: ( Ex<'int'> | Ex<'ivec3'> )[] ): Ex<'ivec3'>;
  ( ...args: ( Ex<'int'> | Ex<'ivec4'> )[] ): Ex<'ivec4'>;
  ( ...args: ( Ex<'uint'> )[] ): Ex<'uint'>;
  ( ...args: ( Ex<'uint'> | Ex<'uvec2'> )[] ): Ex<'uvec2'>;
  ( ...args: ( Ex<'uint'> | Ex<'uvec3'> )[] ): Ex<'uvec3'>;
  ( ...args: ( Ex<'uint'> | Ex<'uvec4'> )[] ): Ex<'uvec4'>;
} = ( ...args: ( string | number )[] ) => (
  `(${args.map( ( arg ) => num( arg ) ).join( '/' )})`
) as any;

/**
 * m * a + b
 */
export const mad: {
  ( a: Exf, b: Exf, c: Exf ): Ex<'float'>;
  ( a: Exf | Ex<'vec2'>, b: Exf | Ex<'vec2'>, c: Exf | Ex<'vec2'> ): Ex<'vec2'>;
  ( a: Exf | Ex<'vec3'>, b: Exf | Ex<'vec3'>, c: Exf | Ex<'vec3'> ): Ex<'vec3'>;
  ( a: Exf | Ex<'vec4'>, b: Exf | Ex<'vec4'>, c: Exf | Ex<'vec4'> ): Ex<'vec4'>;
} = ( a: string | number, b: string | number, c: string | number ) => (
  `(${ num( a ) }*${ num( b ) }+${ num( c ) })`
) as any;

export const lshift: {
  ( x: Ex<'uint'>, y: Ex<'uint'> ): Ex<'uint'>;
} = ( x: string, y: string ) => (
  `(${ x }<<${ y })`
) as any;

export const rshift: {
  ( x: Ex<'int'>, y: Ex<'int'> ): Ex<'int'>;
  ( x: Ex<'uint'>, y: Ex<'uint'> ): Ex<'uint'>;
  ( x: Ex<'uint'> | Ex<'uvec2'>, y: Ex<'uint'> | Ex<'uvec2'> ): Ex<'uvec2'>;
  ( x: Ex<'uint'> | Ex<'uvec3'>, y: Ex<'uint'> | Ex<'uvec3'> ): Ex<'uvec3'>;
  ( x: Ex<'uint'> | Ex<'uvec4'>, y: Ex<'uint'> | Ex<'uvec4'> ): Ex<'uvec4'>;
} = ( x: string, y: string ) => (
  `(${ x }>>${ y })`
) as any;

export const neg: {
  ( x: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( x: Ex<T> ): Ex<T>;
} = ( x: string | number ) => (
  `(-${ x })`
) as any;

export const sq: {
  ( val: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( val: Ex<T> ): Ex<T>;
} = ( val: string | number ) => (
  `(${ num( val ) }*${ num( val ) })`
) as any;

export const tern: {
  ( cond: Ex<'bool'>, truthy: Exf, falsy: Exf ): Ex<'float'>;
  <T extends string>( cond: Ex<'bool'>, truthy: Ex<T>, falsy: Ex<T> ): Ex<T>;
} = ( cond: string, truthy: string | number, falsy: string | number ) => (
  `(${cond}?${num( truthy )}:${num( falsy )})`
) as any;

export const ternChain: {
  ( falsy: Exf, ...condProcArgs: [ Ex<'bool'>, Exf ][] ): Ex<'float'>;
  <T extends string>( falsy: T, ...condProcArgs: [ Ex<'bool'>, T ][] ): T;
} = ( falsy: string | number, ...condProcArgs: [ Ex<'bool'>, string | number ][] ) => {
  const joined = condProcArgs.map( ( [ cond, proc ] ) => (
    `${cond}?${num( proc )}:`
  ) ).join( '' );

  return `(${ joined }${ num( falsy ) })` as any;
};

export const eq: {
  ( x: Exf, y: Exf ): Ex<'bool'>;
  <T extends string>( x: Ex<T>, y: Ex<T> ): Ex<'bool'>;
} = ( x: string | number, y: string | number ) => (
  `(${num( x )}==${num( y )})`
) as any;

export const neq: {
  ( x: Exf, y: Exf ): Ex<'bool'>;
  <T extends string>( x: Ex<T>, y: Ex<T> ): Ex<'bool'>;
} = ( x: string | number, y: string | number ) => (
  `(${num( x )}!=${num( y )})`
) as any;

export const lt: {
  ( x: Exf, y: Exf ): Ex<'bool'>;
  ( x: Ex<'int'>, y: Ex<'int'> ): Ex<'bool'>;
} = ( x: string | number, y: string | number ) => (
  `(${num( x )}<${num( y )})`
) as any;

export const lte: {
  ( x: Exf, y: Exf ): Ex<'bool'>;
  ( x: Ex<'int'>, y: Ex<'int'> ): Ex<'bool'>;
} = ( x: string | number, y: string | number ) => (
  `(${num( x )}<=${num( y )})`
) as any;

export const gt: {
  ( x: Exf, y: Exf ): Ex<'bool'>;
  ( x: Ex<'int'>, y: Ex<'int'> ): Ex<'bool'>;
} = ( x: string | number, y: string | number ) => (
  `(${num( x )}>${num( y )})`
) as any;

export const gte: {
  ( x: Exf, y: Exf ): Ex<'bool'>;
  ( x: Ex<'int'>, y: Ex<'int'> ): Ex<'bool'>;
} = ( x: string | number, y: string | number ) => (
  `(${num( x )}>=${num( y )})`
) as any;

export const not: {
  ( x: Ex<'bool'> ): Ex<'bool'>;
} = ( x: string ) => (
  `(!${ x })`
) as any;

export const and: {
  ( ...args: Ex<'bool'>[] ): Ex<'bool'>;
} = ( ...args: ( string )[] ) => (
  `(${args.map( ( arg ) => num( arg ) ).join( '&&' )})`
) as any;

export const or: {
  ( ...args: Ex<'bool'>[] ): Ex<'bool'>;
} = ( ...args: ( string | number )[] ) => (
  `(${args.map( ( arg ) => num( arg ) ).join( '||' )})`
) as any;

export const xor: {
  ( ...args: Ex<'bool'>[] ): Ex<'bool'>;
} = ( ...args: ( string | number )[] ) => (
  `(${args.map( ( arg ) => num( arg ) ).join( '^^' )})`
) as any;

export const band: {
  ( ...args: Ex<'int'>[] ): Ex<'int'>;
} = ( ...args: ( string | number )[] ) => (
  `(${args.map( ( arg ) => num( arg ) ).join( '&' )})`
) as any;

export const bor: {
  ( ...args: Ex<'int'>[] ): Ex<'int'>;
} = ( ...args: ( string | number )[] ) => (
  `(${args.map( ( arg ) => num( arg ) ).join( '|' )})`
) as any;

export const bxor: {
  ( ...args: Ex<'int'>[] ): Ex<'int'>;
} = ( ...args: ( string | number )[] ) => (
  `(${args.map( ( arg ) => num( arg ) ).join( '^' )})`
) as any;

export const arrayIndex: {
  ( array: Ex<'mat2'>, i: Ex<'int'> ): Ex<'vec2'>;
  ( array: Ex<'mat3'>, i: Ex<'int'> ): Ex<'vec3'>;
  ( array: Ex<'mat4'>, i: Ex<'int'> ): Ex<'vec4'>;
  <T extends string>( array: Ex<`${ T }[]`>, i: Ex<'int'> ): Ex<T>;
} = ( array: string, i: string ) => (
  `(${ array }[${ i }])`
) as any;

export const sw: {
  ( val: Tok<'vec2'>, swizzle: SwizzleComponentVec2 ): Tok<'float'>;
  ( val: Tok<'vec2'>, swizzle: Swizzle2ComponentsVec2 ): Tok<'vec2'>;
  ( val: Tok<'vec2'>, swizzle: Swizzle3ComponentsVec2 ): Tok<'vec3'>;
  ( val: Tok<'vec2'>, swizzle: Swizzle4ComponentsVec2 ): Tok<'vec4'>;
  ( val: Tok<'vec3'>, swizzle: SwizzleComponentVec3 ): Tok<'float'>;
  ( val: Tok<'vec3'>, swizzle: Swizzle2ComponentsVec3 ): Tok<'vec2'>;
  ( val: Tok<'vec3'>, swizzle: Swizzle3ComponentsVec3 ): Tok<'vec3'>;
  ( val: Tok<'vec3'>, swizzle: Swizzle4ComponentsVec3 ): Tok<'vec4'>;
  ( val: Tok<'vec4'>, swizzle: SwizzleComponentVec4 ): Tok<'float'>;
  ( val: Tok<'vec4'>, swizzle: Swizzle2ComponentsVec4 ): Tok<'vec2'>;
  ( val: Tok<'vec4'>, swizzle: Swizzle3ComponentsVec4 ): Tok<'vec3'>;
  ( val: Tok<'vec4'>, swizzle: Swizzle4ComponentsVec4 ): Tok<'vec4'>;
  ( val: Ex<'vec2'>, swizzle: SwizzleComponentVec2 ): Ex<'float'>;
  ( val: Ex<'vec2'>, swizzle: Swizzle2ComponentsVec2 ): Ex<'vec2'>;
  ( val: Ex<'vec2'>, swizzle: Swizzle3ComponentsVec2 ): Ex<'vec3'>;
  ( val: Ex<'vec2'>, swizzle: Swizzle4ComponentsVec2 ): Ex<'vec4'>;
  ( val: Ex<'vec3'>, swizzle: SwizzleComponentVec3 ): Ex<'float'>;
  ( val: Ex<'vec3'>, swizzle: Swizzle2ComponentsVec3 ): Ex<'vec2'>;
  ( val: Ex<'vec3'>, swizzle: Swizzle3ComponentsVec3 ): Ex<'vec3'>;
  ( val: Ex<'vec3'>, swizzle: Swizzle4ComponentsVec3 ): Ex<'vec4'>;
  ( val: Ex<'vec4'>, swizzle: SwizzleComponentVec4 ): Ex<'float'>;
  ( val: Ex<'vec4'>, swizzle: Swizzle2ComponentsVec4 ): Ex<'vec2'>;
  ( val: Ex<'vec4'>, swizzle: Swizzle3ComponentsVec4 ): Ex<'vec3'>;
  ( val: Ex<'vec4'>, swizzle: Swizzle4ComponentsVec4 ): Ex<'vec4'>;
  ( val: Tok<'ivec2'>, swizzle: SwizzleComponentVec2 ): Tok<'int'>;
  ( val: Tok<'ivec2'>, swizzle: Swizzle2ComponentsVec2 ): Tok<'ivec2'>;
  ( val: Tok<'ivec2'>, swizzle: Swizzle3ComponentsVec2 ): Tok<'ivec3'>;
  ( val: Tok<'ivec2'>, swizzle: Swizzle4ComponentsVec2 ): Tok<'ivec4'>;
  ( val: Tok<'ivec3'>, swizzle: SwizzleComponentVec3 ): Tok<'int'>;
  ( val: Tok<'ivec3'>, swizzle: Swizzle2ComponentsVec3 ): Tok<'ivec2'>;
  ( val: Tok<'ivec3'>, swizzle: Swizzle3ComponentsVec3 ): Tok<'ivec3'>;
  ( val: Tok<'ivec3'>, swizzle: Swizzle4ComponentsVec3 ): Tok<'ivec4'>;
  ( val: Tok<'ivec4'>, swizzle: SwizzleComponentVec4 ): Tok<'int'>;
  ( val: Tok<'ivec4'>, swizzle: Swizzle2ComponentsVec4 ): Tok<'ivec2'>;
  ( val: Tok<'ivec4'>, swizzle: Swizzle3ComponentsVec4 ): Tok<'ivec3'>;
  ( val: Tok<'ivec4'>, swizzle: Swizzle4ComponentsVec4 ): Tok<'ivec4'>;
  ( val: Ex<'ivec2'>, swizzle: SwizzleComponentVec2 ): Ex<'int'>;
  ( val: Ex<'ivec2'>, swizzle: Swizzle2ComponentsVec2 ): Ex<'ivec2'>;
  ( val: Ex<'ivec2'>, swizzle: Swizzle3ComponentsVec2 ): Ex<'ivec3'>;
  ( val: Ex<'ivec2'>, swizzle: Swizzle4ComponentsVec2 ): Ex<'ivec4'>;
  ( val: Ex<'ivec3'>, swizzle: SwizzleComponentVec3 ): Ex<'int'>;
  ( val: Ex<'ivec3'>, swizzle: Swizzle2ComponentsVec3 ): Ex<'ivec2'>;
  ( val: Ex<'ivec3'>, swizzle: Swizzle3ComponentsVec3 ): Ex<'ivec3'>;
  ( val: Ex<'ivec3'>, swizzle: Swizzle4ComponentsVec3 ): Ex<'ivec4'>;
  ( val: Ex<'ivec4'>, swizzle: SwizzleComponentVec4 ): Ex<'int'>;
  ( val: Ex<'ivec4'>, swizzle: Swizzle2ComponentsVec4 ): Ex<'ivec2'>;
  ( val: Ex<'ivec4'>, swizzle: Swizzle3ComponentsVec4 ): Ex<'ivec3'>;
  ( val: Ex<'ivec4'>, swizzle: Swizzle4ComponentsVec4 ): Ex<'ivec4'>;
  ( val: Tok<'uvec2'>, swizzle: SwizzleComponentVec2 ): Tok<'uint'>;
  ( val: Tok<'uvec2'>, swizzle: Swizzle2ComponentsVec2 ): Tok<'uvec2'>;
  ( val: Tok<'uvec2'>, swizzle: Swizzle3ComponentsVec2 ): Tok<'uvec3'>;
  ( val: Tok<'uvec2'>, swizzle: Swizzle4ComponentsVec2 ): Tok<'uvec4'>;
  ( val: Tok<'uvec3'>, swizzle: SwizzleComponentVec3 ): Tok<'uint'>;
  ( val: Tok<'uvec3'>, swizzle: Swizzle2ComponentsVec3 ): Tok<'uvec2'>;
  ( val: Tok<'uvec3'>, swizzle: Swizzle3ComponentsVec3 ): Tok<'uvec3'>;
  ( val: Tok<'uvec3'>, swizzle: Swizzle4ComponentsVec3 ): Tok<'uvec4'>;
  ( val: Tok<'uvec4'>, swizzle: SwizzleComponentVec4 ): Tok<'uint'>;
  ( val: Tok<'uvec4'>, swizzle: Swizzle2ComponentsVec4 ): Tok<'uvec2'>;
  ( val: Tok<'uvec4'>, swizzle: Swizzle3ComponentsVec4 ): Tok<'uvec3'>;
  ( val: Tok<'uvec4'>, swizzle: Swizzle4ComponentsVec4 ): Tok<'uvec4'>;
  ( val: Ex<'uvec2'>, swizzle: SwizzleComponentVec2 ): Ex<'uint'>;
  ( val: Ex<'uvec2'>, swizzle: Swizzle2ComponentsVec2 ): Ex<'uvec2'>;
  ( val: Ex<'uvec2'>, swizzle: Swizzle3ComponentsVec2 ): Ex<'uvec3'>;
  ( val: Ex<'uvec2'>, swizzle: Swizzle4ComponentsVec2 ): Ex<'uvec4'>;
  ( val: Ex<'uvec3'>, swizzle: SwizzleComponentVec3 ): Ex<'uint'>;
  ( val: Ex<'uvec3'>, swizzle: Swizzle2ComponentsVec3 ): Ex<'uvec2'>;
  ( val: Ex<'uvec3'>, swizzle: Swizzle3ComponentsVec3 ): Ex<'uvec3'>;
  ( val: Ex<'uvec3'>, swizzle: Swizzle4ComponentsVec3 ): Ex<'uvec4'>;
  ( val: Ex<'uvec4'>, swizzle: SwizzleComponentVec4 ): Ex<'uint'>;
  ( val: Ex<'uvec4'>, swizzle: Swizzle2ComponentsVec4 ): Ex<'uvec2'>;
  ( val: Ex<'uvec4'>, swizzle: Swizzle3ComponentsVec4 ): Ex<'uvec3'>;
  ( val: Ex<'uvec4'>, swizzle: Swizzle4ComponentsVec4 ): Ex<'uvec4'>;
} = ( val: string, swizzle: string ) => (
  `${val}.${swizzle}`
) as any;

function __callFn( name: string ): ( ...args: ( string | number )[] ) => string {
  return ( ...args ) => (
    `${ name }(${ args.map( ( arg ) => num( arg ) ).join( ',' ) })`
  );
}

export const uintBitsToFloat: {
  ( x: Ex<'uint'> ): Ex<'float'>;
  ( x: Ex<'uvec2'> ): Ex<'vec2'>;
  ( x: Ex<'uvec3'> ): Ex<'vec3'>;
  ( x: Ex<'uvec4'> ): Ex<'vec4'>;
} = __callFn( 'uintBitsToFloat' ) as any;

export const floatBitsToUint: {
  ( x: Ex<'float'> ): Ex<'uint'>;
  ( x: Ex<'vec2'> ): Ex<'uvec2'>;
  ( x: Ex<'vec3'> ): Ex<'uvec3'>;
  ( x: Ex<'vec4'> ): Ex<'uvec4'>;
} = __callFn( 'floatBitsToUint' ) as any;

export const pow: {
  ( x: Exf, y: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( x: Ex<T>, y: Ex<T> ): Ex<T>;
} = __callFn( 'pow' ) as any;

export const sqrt: {
  ( x: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( x: Ex<T> ): Ex<T>;
} = __callFn( 'sqrt' ) as any;

export const log: {
  ( x: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( x: Ex<T> ): Ex<T>;
} = __callFn( 'log' ) as any;

export const log2: {
  ( x: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( x: Ex<T> ): Ex<T>;
} = __callFn( 'log2' ) as any;

export const exp: {
  ( x: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( x: Ex<T> ): Ex<T>;
} = __callFn( 'exp' ) as any;

export const exp2: {
  ( x: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( x: Ex<T> ): Ex<T>;
} = __callFn( 'exp' ) as any;

export const floor: {
  ( x: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( x: Ex<T> ): Ex<T>;
} = __callFn( 'floor' ) as any;

export const fract: {
  ( x: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( x: Ex<T> ): Ex<T>;
} = __callFn( 'fract' ) as any;

export const mod: {
  ( x: Exf, y: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( x: Ex<T>, y: Exf ): Ex<T>;
  <T extends GLSLGenType>( x: Ex<T>, y: Ex<T> ): Ex<T>;
} = __callFn( 'mod' ) as any;

export const abs: {
  ( x: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( x: Ex<T> ): Ex<T>;
} = __callFn( 'abs' ) as any;

export const sign: {
  ( x: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( x: Ex<T> ): Ex<T>;
} = __callFn( 'sign' ) as any;

export const sin: {
  ( x: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( x: Ex<T> ): Ex<T>;
} = __callFn( 'sin' ) as any;

export const cos: {
  ( x: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( x: Ex<T> ): Ex<T>;
} = __callFn( 'cos' ) as any;

export const tan: {
  ( x: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( x: Ex<T> ): Ex<T>;
} = __callFn( 'tan' ) as any;

export const asin: {
  ( x: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( x: Ex<T> ): Ex<T>;
} = __callFn( 'asin' ) as any;

export const acos: {
  ( x: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( x: Ex<T> ): Ex<T>;
} = __callFn( 'acos' ) as any;

export const atan: {
  ( x: Exf, y: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( x: Ex<T>, y: Ex<T> ): Ex<T>;
} = __callFn( 'atan' ) as any;

export const length: {
  <T extends 'vec2' | 'vec3' | 'vec4'>( x: Ex<T> ): Ex<'float'>;
} = __callFn( 'length' ) as any;

export const normalize: {
  <T extends 'vec2' | 'vec3' | 'vec4'>( x: Ex<T> ): Ex<T>;
} = __callFn( 'normalize' ) as any;

export const dot: {
  ( x: Ex<'vec2'>, y: Ex<'vec2'> ): Ex<'float'>;
  ( x: Ex<'vec3'>, y: Ex<'vec3'> ): Ex<'float'>;
  ( x: Ex<'vec4'>, y: Ex<'vec4'> ): Ex<'float'>;
} = __callFn( 'dot' ) as any;

export const cross: {
  ( x: Ex<'vec3'>, y: Ex<'vec3'> ): Ex<'vec3'>;
} = __callFn( 'cross' ) as any;

export const reflect: {
  <T extends 'vec2' | 'vec3' | 'vec4'>( i: Ex<T>, n: Ex<T> ): Ex<T>;
} = __callFn( 'reflect' ) as any;

export const refract: {
  <T extends 'vec2' | 'vec3' | 'vec4'>( i: Ex<T>, n: Ex<T>, eta: Exf ): Ex<T>;
} = __callFn( 'refract' ) as any;

export const mix: {
  ( a: Exf, b: Exf, t: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( a: Ex<T>, b: Ex<T>, t: Exf ): Ex<T>;
  <T extends GLSLGenType>( a: Ex<T>, b: Ex<T>, t: Ex<T> ): Ex<T>;
} = __callFn( 'mix' ) as any;

export const min: {
  ( a: Exf, b: Exf ): Ex<'float'>;
  ( a: Ex<'vec2'>, b: Ex<'vec2'> ): Ex<'vec2'>;
  ( a: Ex<'vec3'>, b: Ex<'vec3'> ): Ex<'vec3'>;
  ( a: Ex<'vec4'>, b: Ex<'vec4'> ): Ex<'vec4'>;
  <T extends GLSLGenType>( a: Ex<T>, b: Exf ): Ex<T>;
} = __callFn( 'min' ) as any;

export const max: {
  ( a: Exf, b: Exf ): Ex<'float'>;
  ( a: Ex<'vec2'>, b: Ex<'vec2'> ): Ex<'vec2'>;
  ( a: Ex<'vec3'>, b: Ex<'vec3'> ): Ex<'vec3'>;
  ( a: Ex<'vec4'>, b: Ex<'vec4'> ): Ex<'vec4'>;
  <T extends GLSLGenType>( a: Ex<T>, b: Exf ): Ex<T>;
} = __callFn( 'max' ) as any;

export const clamp: {
  ( x: Exf, min: Exf, max: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( x: Ex<T>, min: Exf, max: Exf ): Ex<T>;
  <T extends GLSLGenType>( x: Ex<T>, min: Ex<T>, max: Ex<T> ): Ex<T>;
} = __callFn( 'clamp' ) as any;

export const step: {
  ( edge: Exf, x: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( edge: Exf, x: Ex<T> ): Ex<T>;
  <T extends GLSLGenType>( edge: Ex<T>, x: Ex<T> ): Ex<T>;
} = __callFn( 'step' ) as any;

export const mixStepChain: {
  ( x: Exf, smallest: Exf, ...edgeValueArgs: [ Exf, Exf ][] ): Ex<'float'>;
  <T extends string>( x: Exf, smallest: T, ...edgeValueArgs: [ Exf, T ][] ): T;
} = ( x: Exf, smallest: string | number, ...edgeValueArgs: [ Exf, string | number ][] ) => {
  const len = edgeValueArgs.length;

  if ( len === 1 ) {
    return mix(
      smallest as any,
      edgeValueArgs[ 0 ][ 1 ] as any,
      step( edgeValueArgs[ 0 ][ 0 ], x ),
    );
  } else if ( len === 2 ) {
    return mix(
      mixStepChain( x, smallest as any, edgeValueArgs[ 0 ] ),
      edgeValueArgs[ 1 ][ 1 ] as any,
      step( edgeValueArgs[ 1 ][ 0 ], x ),
    );
  }

  const splitIndex = ~~( edgeValueArgs.length / 2 );
  return mix(
    mixStepChain(
      x,
      smallest as any,
      ...( edgeValueArgs.slice( 0, splitIndex ) as any ),
    ),
    mixStepChain(
      x,
      edgeValueArgs[ splitIndex ][ 1 ] as any,
      ...( edgeValueArgs.slice( splitIndex + 1 ) as any ),
    ),
    step( edgeValueArgs[ splitIndex ][ 0 ], x ),
  );
};

export const smoothstep: {
  ( edge0: Exf, edge1: Exf, x: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( edge0: Exf, edge1: Exf, x: Ex<T> ): Ex<T>;
  <T extends GLSLGenType>( edge0: Ex<T>, edge1: Ex<T>, x: Ex<T> ): Ex<T>;
} = __callFn( 'smoothstep' ) as any;

export const transpose: {
  ( a: Ex<'mat2'> ): Ex<'mat2'>;
  ( a: Ex<'mat3'> ): Ex<'mat3'>;
  ( a: Ex<'mat4'> ): Ex<'mat4'>;
} = __callFn( 'transpose' ) as any;

export const dFdx: {
  ( x: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( x: Ex<T> ): Ex<T>;
} = __callFn( 'dFdx' ) as any;

export const dFdy: {
  ( x: Exf ): Ex<'float'>;
  <T extends GLSLGenType>( x: Ex<T> ): Ex<T>;
} = __callFn( 'dFdy' ) as any;

export const texture: {
  ( sampler: Ex<'sampler2D'>, x: Ex<'vec2'> ): Ex<'vec4'>;
} = __callFn( 'texture' ) as any;

export const textureLod: {
  ( sampler: Ex<'sampler2D'>, x: Ex<'vec2'>, lod: Exf ): Ex<'vec4'>;
} = __callFn( 'textureLod' ) as any;

export const texelFetch: {
  ( sampler: Ex<'sampler2D'>, x: Ex<'ivec2'>, lod: Ex<'int'> ): Ex<'vec4'>;
} = __callFn( 'texelFetch' ) as any;

type FloatArg =
  | Exf
  | Ex<'int'>
  | Ex<'uint'>;
export const float: {
  ( val: FloatArg ): Ex<'float'>;
  ( val: Ex<'bool'> ): Ex<'float'>;
} = __callFn( 'float' ) as any;

type Vec2Args =
  | [ FloatArg, FloatArg ]
  | [ Ex<'vec2'> ]
  | [ Ex<'ivec2'> ]
  | [ Ex<'uvec2'> ];
export const vec2: {
  ( ...args: Vec2Args ): Ex<'vec2'>;
  ( scalar: FloatArg ): Ex<'vec2'>;
} = __callFn( 'vec2' ) as any;

type Vec3Args =
  | [ ...Vec2Args, FloatArg ]
  | [ FloatArg, ...Vec2Args ]
  | [ Ex<'vec3'> ]
  | [ Ex<'ivec3'> ]
  | [ Ex<'uvec3'> ];
export const vec3: {
  ( ...args: Vec3Args ): Ex<'vec3'>;
  ( scalar: FloatArg ): Ex<'vec3'>;
} = __callFn( 'vec3' ) as any;

type Vec4Args =
  | [ ...Vec3Args, FloatArg ]
  | [ ...Vec2Args, ...Vec2Args ]
  | [ FloatArg, ...Vec3Args ]
  | [ Ex<'vec4'> ]
  | [ Ex<'ivec4'> ]
  | [ Ex<'uvec4'> ];
export const vec4: {
  ( ...args: Vec4Args ): Ex<'vec4'>;
  ( scalar: FloatArg ): Ex<'vec4'>;
} = __callFn( 'vec4' ) as any;

// TODO: type
export const int: {
  ( ...args: any[] ): Ex<'int'>;
} = __callFn( 'int' ) as any;
export const ivec2: {
  ( ...args: any[] ): Ex<'ivec2'>;
} = __callFn( 'ivec2' ) as any;
export const ivec3: {
  ( ...args: any[] ): Ex<'ivec3'>;
} = __callFn( 'ivec3' ) as any;
export const ivec4: {
  ( ...args: any[] ): Ex<'ivec4'>;
} = __callFn( 'ivec4' ) as any;
export const uint: {
  ( ...args: any[] ): Ex<'uint'>;
} = __callFn( 'uint' ) as any;
export const uvec2: {
  ( ...args: any[] ): Ex<'uvec2'>;
} = __callFn( 'uvec2' ) as any;
export const uvec3: {
  ( ...args: any[] ): Ex<'uvec3'>;
} = __callFn( 'uvec3' ) as any;
export const uvec4: {
  ( ...args: any[] ): Ex<'uvec4'>;
} = __callFn( 'uvec4' ) as any;
export const mat2: {
  ( ...args: any[] ): Ex<'mat2'>;
} = __callFn( 'mat2' ) as any;
export const mat3: {
  ( ...args: any[] ): Ex<'mat3'>;
} = __callFn( 'mat3' ) as any;
export const mat4: {
  ( ...args: any[] ): Ex<'mat4'>;
} = __callFn( 'mat4' ) as any;

export function discard(): void {
  insert( 'discard;' );
}

export function retFn( val?: number | string ): void {
  insert( `return ${ num( val ?? '' ) };` );
}

export function ifThen( condition: Ex<'bool'>, truthy: () => void, falsy?: () => void ): void {
  __stack.unshift( '' );
  truthy();
  const t = __stack.shift();
  insert( `if(${ condition }){${ t }}` );

  if ( falsy != null ) {
    __stack.unshift( '' );
    falsy();
    const f = __stack.shift();
    insert( `else{${ f }}` );
  }
}

export function ifChain( ...condProcArgs: [ Ex<'bool'>, () => void ][] ): void {
  insert(
    condProcArgs.map( ( [ cond, proc ] ) => {
      __stack.unshift( '' );
      proc();
      const p = __stack.shift();
      return `if(${ cond }){${ p }}`;
    } ).join( 'else ' )
  );
}

export function unrollLoop( count: number, func: ( count: number ) => void ): void {
  arraySerial( count ).map( ( i ) => {
    __stack.unshift( '' );
    func( i );
    const procedure = __stack.shift();
    insert( `{${ procedure }}` );
  } );
}

export function forLoop( count: number, func: ( count: GLSLExpression<'int'> ) => void ): void {
  const loopToken = genToken() as GLSLExpression<'int'>;
  __stack.unshift( '' );
  func( loopToken );
  const procedure = __stack.shift();
  insert( `for(int ${ loopToken }=0;${ loopToken }<${ count };${ loopToken }++){${ procedure }}` );
}

export function forBreak(): void {
  insert( 'break;' );
}

/* eslint-disable max-len */
export function defFn<T extends string>( returnType: T, argsType: [], build: () => void ): () => Ex<T>;
export function defFn<T extends string, TArg1 extends string>(
  returnType: T,
  argsType: [ TArg1 ],
  build: ( arg1: Tok<TArg1> ) => void
): ( arg1: Ex<TArg1> ) => Ex<T>;
export function defFn<T extends string, TArg1 extends string, TArg2 extends string>(
  returnType: T,
  argsType: [ TArg1, TArg2 ],
  build: ( arg1: Tok<TArg1>, arg2: Tok<TArg2> ) => void
): ( arg1: Ex<TArg1>, arg2: Ex<TArg2> ) => Ex<T>;
export function defFn<T extends string, TArg1 extends string, TArg2 extends string, TArg3 extends string>(
  returnType: T,
  argsType: [ TArg1, TArg2, TArg3 ],
  build: ( arg1: Tok<TArg1>, arg2: Tok<TArg2>, arg3: Tok<TArg3> ) => void
): ( arg1: Ex<TArg1>, arg2: Ex<TArg2>, arg3: Ex<TArg3> ) => Ex<T>;
export function defFn<T extends string, TArg1 extends string, TArg2 extends string, TArg3 extends string, TArg4 extends string>(
  returnType: T,
  argsType: [ TArg1, TArg2, TArg3, TArg4 ],
  build: ( arg1: Tok<TArg1>, arg2: Tok<TArg2>, arg3: Tok<TArg3>, arg4: Tok<TArg4> ) => void
): ( arg1: Ex<TArg1>, arg2: Ex<TArg2>, arg3: Ex<TArg3>, arg4: Ex<TArg4> ) => Ex<T>;
export function defFn<T extends string, TArg1 extends string, TArg2 extends string, TArg3 extends string, TArg4 extends string, TArg5 extends string>(
  returnType: T,
  argsType: [ TArg1, TArg2, TArg3, TArg4, TArg5 ],
  build: ( arg1: Tok<TArg1>, arg2: Tok<TArg2>, arg3: Tok<TArg3>, arg4: Tok<TArg4>, arg5: Tok<TArg5> ) => void
): ( arg1: Ex<TArg1>, arg2: Ex<TArg2>, arg3: Ex<TArg3>, arg4: Ex<TArg4>, arg5: Ex<TArg5> ) => Ex<T>;
export function defFn<T extends string, TArg1 extends string, TArg2 extends string, TArg3 extends string, TArg4 extends string, TArg5 extends string, TArg6 extends string>(
  returnType: T,
  argsType: [ TArg1, TArg2, TArg3, TArg4, TArg5, TArg6 ],
  build: ( arg1: Tok<TArg1>, arg2: Tok<TArg2>, arg3: Tok<TArg3>, arg4: Tok<TArg4>, arg5: Tok<TArg5>, arg6: Tok<TArg6> ) => void
): ( arg1: Ex<TArg1>, arg2: Ex<TArg2>, arg3: Ex<TArg3>, arg4: Ex<TArg4>, arg5: Ex<TArg5>, arg6: Ex<TArg6> ) => Ex<T>;
/* eslint-enable max-len */
export function defFn<T extends string, TArgs extends string[]>(
  returnType: T,
  argsType: TArgs,
  build: ( ...args: Tok<string>[] ) => void,
): ( ...args: Ex<string>[] ) => Ex<T> {
  const token = genToken();

  const argsTypeTokenPair = argsType.map( ( type ) => [ type, genToken() ] );
  const argsToken = argsTypeTokenPair.map( ( [ _, token ] ) => token );
  const argsStatement = argsTypeTokenPair.map( ( arr ) => arr.join( ' ' ) ).join( ',' );

  __stack.unshift( '' );
  ( build as any )( ...argsToken );
  const procedure = __stack.shift();

  insertTop( `${returnType} ${token}(${argsStatement}){${ procedure }}` );

  return __callFn( token ) as any;
}

export function main( builder: () => void ): void {
  __stack.unshift( '' );
  builder();
  const procedure = __stack.shift();
  insert( `void main(){${ procedure }}` );
}

export function build( builder: () => void ): string {
  __stack.unshift( '#version 300 es\n' );
  __charIndex = 0;

  builder();

  __cache.clear();
  return __stack.shift()!;
}
