import { GL_LINES } from '../../gl/constants';
import { Geometry } from '../../heck/Geometry';
import { Lambda } from '../../heck/components/Lambda';
import { MTL_PBR_ROUGHNESS_METALLIC } from '../CameraStack/deferredConstants';
import { Material } from '../../heck/Material';
import { Mesh } from '../../heck/components/Mesh';
import { SEVEN_SEG_PRIMCOUNT, SevenSegTransforms } from './SevenSegTransforms';
import { SceneNode } from '../../heck/components/SceneNode';
import { dummyRenderTarget4 } from '../../globals/dummyRenderTarget';
import { glCreateVertexbuffer } from '../../gl/glCreateVertexbuffer';
import { glVertexArrayBindVertexbuffer } from '../../gl/glVertexArrayBindVertexbuffer';
import { sevenSegFrag } from './shaders/sevenSegFrag';
import { sevenSegVert } from './shaders/sevenSegVert';
import { sevenSegWireFrag } from './shaders/sevenSegWireFrag';
import { vecNormalize } from '@0b5vr/experimental';

// == geometry utils ===============================================================================
function appendHex(
  vertices: number[],
  position: number[],
  normal: number[],
): void {
  const [
    x1, y1, x2, y2, x3, y3, x4, y4, x5, y5, x6, y6,
  ] = vertices;

  [
    [ x1, y1, x2, y2, x3, y3 ],
    [ x1, y1, x3, y3, x4, y4 ],
    [ x1, y1, x4, y4, x5, y5 ],
    [ x1, y1, x5, y5, x6, y6 ],
  ].map( ( [ xa, ya, xb, yb, xc, yc ] ) => {
    position.push(
      xa, ya, 0.1, xb, yb, 0.1, xc, yc, 0.1,
      xa, ya, -0.1, xc, yc, -0.1, xb, yb, -0.1,
    );

    normal.push(
      0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,
      0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,
    );
  } );

  [
    [ x1, y1, x2, y2 ],
    [ x2, y2, x3, y3 ],
    [ x3, y3, x4, y4 ],
    [ x4, y4, x5, y5 ],
    [ x5, y5, x6, y6 ],
    [ x6, y6, x1, y1 ],
  ].map( ( [ xa, ya, xb, yb ] ) => {
    const [ nx, ny ] = vecNormalize( [ yb - ya, xa - xb ] );

    position.push(
      xa, ya, 0.1, xa, ya, -0.1, xb, yb, -0.1,
      xa, ya, 0.1, xb, yb, -0.1, xb, yb, 0.1,
    );

    normal.push(
      nx, ny, 0.0, nx, ny, 0.0, nx, ny, 0.0,
      nx, ny, 0.0, nx, ny, 0.0, nx, ny, 0.0,
    );
  } );
}

function appendWireHex(
  vertices: number[],
  position: number[],
): void {
  const [
    x1, y1, x2, y2, x3, y3, x4, y4, x5, y5, x6, y6,
  ] = vertices;

  [
    [ x1, y1, x2, y2 ],
    [ x2, y2, x3, y3 ],
    [ x3, y3, x4, y4 ],
    [ x4, y4, x5, y5 ],
    [ x5, y5, x6, y6 ],
    [ x6, y6, x1, y1 ],
  ].map( ( [ xa, ya, xb, yb ] ) => {
    position.push(
      xa, ya, 0.1, xb, yb, 0.1,
      xa, ya, 0.1, xa, ya, -0.1,
      xa, ya, -0.1, xb, yb, -0.1,
    );
  } );
}

// == geometries ===================================================================================
// -- vertices -------------------------------------------------------------------------------------
const arrayPosition: number[] = [];
const arrayNormal: number[] = [];
const arraySegIds: number[] = [];

const arrayPositionWire: number[] = [];

[
  [ -0.34, 1.0, -0.4, 0.94, -0.3, 0.84, 0.3, 0.84, 0.4, 0.94, 0.34, 1.0 ], // A
  [ 0.44, 0.9, 0.34, 0.8, 0.34, 0.1, 0.42, 0.02, 0.5, 0.1, 0.5, 0.84 ], // B
  [ 0.42, -0.02, 0.34, -0.1, 0.34, -0.8, 0.44, -0.9, 0.5, -0.84, 0.5, -0.1 ], // C
  [ -0.3, -0.84, -0.4, -0.94, -0.34, -1.0, 0.34, -1.0, 0.4, -0.94, 0.3, -0.84 ], // D
  [ -0.42, -0.02, -0.5, -0.1, -0.5, -0.84, -0.44, -0.9, -0.34, -0.8, -0.34, -0.1 ], // E
  [ -0.44, 0.9, -0.5, 0.84, -0.5, 0.1, -0.42, 0.02, -0.34, 0.1, -0.34, 0.8 ], // F
  [ -0.3, 0.08, -0.38, 0.0, -0.3, -0.08, 0.3, -0.08, 0.38, 0.0, 0.3, 0.08 ], // G
].map( ( vertices, iSeg ) => {
  for ( let i = 0; i < 12; i += 2 ) {
    vertices[ i ] += 0.1 * vertices[ i + 1 ];
  }

  appendHex( vertices, arrayPosition, arrayNormal );
  appendWireHex( vertices, arrayPositionWire );
  arraySegIds.push( ...Array( 60 ).fill( iSeg ) );
} );

// -- geometry -------------------------------------------------------------------------------------
const position = glCreateVertexbuffer( new Float32Array( arrayPosition ) );
const normal = glCreateVertexbuffer( new Float32Array( arrayNormal ) );
const segIds = glCreateVertexbuffer( new Float32Array( arraySegIds ) );
const instanceIds = glCreateVertexbuffer( new Float32Array(
  [ ...Array( SEVEN_SEG_PRIMCOUNT ) ].map( ( _, i ) => i )
) );

const geometry = new Geometry();
geometry.count = 60 * 7;
geometry.primcount = SEVEN_SEG_PRIMCOUNT;

glVertexArrayBindVertexbuffer( geometry.vao, position, 0, 3 );
glVertexArrayBindVertexbuffer( geometry.vao, normal, 1, 3 );
glVertexArrayBindVertexbuffer( geometry.vao, segIds, 2, 1 );
glVertexArrayBindVertexbuffer( geometry.vao, instanceIds, 3, 1, 1 );

// -- geometry wire --------------------------------------------------------------------------------
const positionWire = glCreateVertexbuffer( new Float32Array( arrayPositionWire ) );

const geometryWire = new Geometry();
geometryWire.count = 36 * 7;
geometryWire.primcount = SEVEN_SEG_PRIMCOUNT;
geometryWire.mode = GL_LINES;

glVertexArrayBindVertexbuffer( geometryWire.vao, positionWire, 0, 3 );

// -- instanced matrices ---------------------------------------------------------------------------
const transforms = new SevenSegTransforms();

glVertexArrayBindVertexbuffer( geometry.vao, transforms.buffer, 4, 4, 1, 64, 0 );
glVertexArrayBindVertexbuffer( geometry.vao, transforms.buffer, 5, 4, 1, 64, 16 );
glVertexArrayBindVertexbuffer( geometry.vao, transforms.buffer, 6, 4, 1, 64, 32 );
glVertexArrayBindVertexbuffer( geometry.vao, transforms.buffer, 7, 4, 1, 64, 48 );

glVertexArrayBindVertexbuffer( geometryWire.vao, transforms.buffer, 4, 4, 1, 64, 0 );
glVertexArrayBindVertexbuffer( geometryWire.vao, transforms.buffer, 5, 4, 1, 64, 16 );
glVertexArrayBindVertexbuffer( geometryWire.vao, transforms.buffer, 6, 4, 1, 64, 32 );
glVertexArrayBindVertexbuffer( geometryWire.vao, transforms.buffer, 7, 4, 1, 64, 48 );

// == material =====================================================================================
const deferred = new Material(
  sevenSegVert,
  sevenSegFrag,
  {
    initOptions: { target: dummyRenderTarget4, geometry },
    offsetFactor: [ 2, 0 ],
  },
);

deferred.addUniform( 'color', '4f', 0.02, 0.02, 0.02, 1.0 );
deferred.addUniform( 'mtlKind', '1f', MTL_PBR_ROUGHNESS_METALLIC );
deferred.addUniform( 'mtlParams', '4f', 0.5, 0.0, 0.0, 0.0 );

const deferredWire = new Material(
  sevenSegVert,
  sevenSegWireFrag,
  {
    initOptions: { target: dummyRenderTarget4, geometry },
  },
);

// == main =========================================================================================
export class SevenSeg extends SceneNode {
  public constructor() {
    super();

    // -- children ---------------------------------------------------------------------------------
    this.children = [
      new Lambda( {
        onUpdate( { time } ) {
          transforms.update( time );
        },
      } ),
      new Mesh( {
        geometry,
        materials: { deferred },
      } ),
      new Mesh( {
        geometry: geometryWire,
        materials: { deferred: deferredWire },
      } ),
    ];
  }
}
