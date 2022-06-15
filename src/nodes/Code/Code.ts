import { Geometry } from '../../heck/Geometry';
import { Material } from '../../heck/Material';
import { dummyRenderTarget1 } from '../../globals/dummyRenderTarget';
import { codeRenderFrag } from './shaders/codeRenderFrag';
import { codeRenderVert } from './shaders/codeRenderVert';
import { glVertexArrayBindVertexbuffer } from '../../gl/glVertexArrayBindVertexbuffer';
import { glCreateVertexbuffer } from '../../gl/glCreateVertexbuffer';
import { GL_ARRAY_BUFFER, GL_DYNAMIC_DRAW, GL_ONE_MINUS_SRC_ALPHA, GL_SRC_ALPHA, GL_TEXTURE_2D, GL_TRIANGLE_STRIP } from '../../gl/constants';
import { SceneNode } from '../../heck/components/SceneNode';
import { TRIANGLE_STRIP_QUAD } from '@0b5vr/experimental';
import { Mesh } from '../../heck/components/Mesh';
import { UITag } from '../common/UITag';
import { charTexture } from '../common/charTexture';
import { gl } from '../../globals/canvas';
import { music } from '../../globals/music';
import { withinShaderEventRange } from '../../music/withinShaderEventRange';

const chars = 65536;

export class Code extends SceneNode {
  public constructor() {
    super();

    // -- geometry render --------------------------------------------------------------------------
    const geometry = new Geometry();

    const bufferPos = glCreateVertexbuffer( new Float32Array( TRIANGLE_STRIP_QUAD ) );

    glVertexArrayBindVertexbuffer( geometry.vao, bufferPos, 0, 2 );

    const arrayChars = new Float32Array( 4 * chars );
    const bufferChars = glCreateVertexbuffer( arrayChars, GL_DYNAMIC_DRAW );

    glVertexArrayBindVertexbuffer( geometry.vao, bufferChars, 1, 4, 1 );

    geometry.count = 4;
    geometry.primcount = chars;
    geometry.mode = GL_TRIANGLE_STRIP;

    // -- material render --------------------------------------------------------------------------
    const forward = new Material(
      codeRenderVert,
      codeRenderFrag,
      {
        initOptions: { geometry, target: dummyRenderTarget1 },
        blend: [ GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA ],
      },
    );

    forward.addUniform( 'scroll', '1f', 90.0 );
    forward.addUniformTextures( 'samplerChar', GL_TEXTURE_2D, charTexture );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        [
          './shaders/codeRenderVert',
          './shaders/codeRenderFrag',
        ],
        ( [ v, f ] ) => {
          forward.replaceShader(
            v?.codeRenderVert,
            f?.codeRenderFrag,
          );
        },
      );
    }

    // -- mesh -------------------------------------------------------------------------------------
    const mesh = new Mesh( { geometry, materials: { forward } } );
    mesh.depthTest = false;
    mesh.depthWrite = false;
    mesh.tags = [ UITag ];

    if ( import.meta.env.DEV ) {
      mesh.name = 'mesh';
    }

    // -- set code ---------------------------------------------------------------------------------
    const { shaderEventManager } = music;
    shaderEventManager.onAlter = ( change ) => {
      let head = 0;

      shaderEventManager.lines.map( ( line, iLine ) => {
        [ ...Array( line.length ) ].map( ( _, iCol ) => {
          let time = -1E9;

          if ( withinShaderEventRange( change, iLine, iCol ) ) {
            time = music.time;
          }

          if ( withinShaderEventRange( shaderEventManager.select, iLine, iCol ) ) {
            time = 1E9;
          }

          arrayChars[ head ++ ] = iCol; // x
          arrayChars[ head ++ ] = iLine; // y
          arrayChars[ head ++ ] = line.toUpperCase().charCodeAt( iCol ); // char
          arrayChars[ head ++ ] = time; // spawn time
        } );
      } );
      arrayChars.fill( 0, head );

      gl.bindBuffer( GL_ARRAY_BUFFER, bufferChars );
      gl.bufferData( GL_ARRAY_BUFFER, arrayChars, GL_DYNAMIC_DRAW );
      gl.bindBuffer( GL_ARRAY_BUFFER, null );
    };

    // -- components -------------------------------------------------------------------------------
    this.children = [
      mesh,
    ];
  }
}
