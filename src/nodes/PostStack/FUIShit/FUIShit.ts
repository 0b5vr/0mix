import { GL_ONE, GL_ONE_MINUS_SRC_ALPHA, GL_STATIC_DRAW, GL_TRIANGLE_STRIP } from '../../../gl/constants';
import { Geometry } from '../../../heck/Geometry';
import { Material } from '../../../heck/Material';
import { Quad } from '../../../heck/components/Quad';
import { RenderTarget } from '../../../heck/RenderTarget';
import { SceneNode } from '../../../heck/components/SceneNode';
import { arraySerial } from '@0b5vr/experimental';
import { auto } from '../../../globals/automaton';
import { dummyRenderTarget1 } from '../../../globals/dummyRenderTarget';
import { fuiShitFrag } from './shaders/fuiShitFrag';
import { fuiShitVert } from './shaders/fuiShitVert';
import { glCreateVertexbuffer } from '../../../gl/glCreateVertexbuffer';
import { glVertexArrayBindVertexbuffer } from '../../../gl/glVertexArrayBindVertexbuffer';
import { quadBuffer } from '../../../globals/quadGeometry';

const FUISHIT_COMPONENTS = 32;

interface FUIShitOptions {
  target: RenderTarget;
}

export class FUIShit extends SceneNode {
  public constructor( { target }: FUIShitOptions ) {
    super();

    // -- geometry ---------------------------------------------------------------------------------
    const geometry = new Geometry();

    glVertexArrayBindVertexbuffer( geometry.vao, quadBuffer, 0, 2 );

    const arrayComponents = new Float32Array( arraySerial( FUISHIT_COMPONENTS ) );
    const bufferComponents = glCreateVertexbuffer( arrayComponents, GL_STATIC_DRAW );

    glVertexArrayBindVertexbuffer( geometry.vao, bufferComponents, 1, 1, 1 );

    geometry.count = 4;
    geometry.primcount = FUISHIT_COMPONENTS;
    geometry.mode = GL_TRIANGLE_STRIP;

    auto( 'FUIShit/count', ( { value } ) => geometry.primcount = value );

    // -- material render --------------------------------------------------------------------------
    const forward = new Material(
      fuiShitVert,
      fuiShitFrag,
      {
        initOptions: { geometry, target: dummyRenderTarget1 },
        blend: [ GL_ONE, GL_ONE_MINUS_SRC_ALPHA ],
      },
    );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        [
          './shaders/fuiShitVert',
          './shaders/fuiShitFrag',
        ],
        ( [ v, f ] ) => {
          forward.replaceShader(
            v?.fuiShitVert,
            f?.fuiShitFrag,
          );
        },
      );
    }

    // -- quad -------------------------------------------------------------------------------------
    const quad = new Quad( {
      geometry,
      material: forward,
      target,
    } ); // TODO: Quad???

    quad.depthTest = false;
    quad.depthWrite = false;

    if ( import.meta.env.DEV ) {
      quad.name = 'quad';
    }

    // -- components -------------------------------------------------------------------------------
    this.children = [
      quad,
    ];
  }
}
