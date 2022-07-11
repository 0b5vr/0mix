import { Geometry } from '../../../heck/Geometry';
import { Material } from '../../../heck/Material';
import { dummyRenderTarget1 } from '../../../globals/dummyRenderTarget';
import { codeRenderFrag } from './shaders/codeRenderFrag';
import { codeRenderVert } from './shaders/codeRenderVert';
import { glVertexArrayBindVertexbuffer } from '../../../gl/glVertexArrayBindVertexbuffer';
import { glCreateVertexbuffer } from '../../../gl/glCreateVertexbuffer';
import { GL_ARRAY_BUFFER, GL_DYNAMIC_DRAW, GL_ONE_MINUS_SRC_ALPHA, GL_SRC_ALPHA, GL_TEXTURE_2D, GL_TRIANGLE_STRIP } from '../../../gl/constants';
import { SceneNode } from '../../../heck/components/SceneNode';
import { gl } from '../../../globals/canvas';
import { music } from '../../../globals/music';
import { withinShaderEventRange } from '../../../music/withinShaderEventRange';
import { Lambda } from '../../../heck/components/Lambda';
import { quadBuffer } from '../../../globals/quadGeometry';
import { Quad } from '../../../heck/components/Quad';
import { RenderTarget } from '../../../heck/RenderTarget';
import { codeCharTexture } from './codeCharTexture';
import { promiseGui } from '../../../globals/gui';

const chars = 65536;

interface CodeOptions {
  target: RenderTarget;
}

export class Code extends SceneNode {
  public constructor( { target }: CodeOptions ) {
    super();

    // -- geometry render --------------------------------------------------------------------------
    const geometry = new Geometry();

    glVertexArrayBindVertexbuffer( geometry.vao, quadBuffer, 0, 2 );

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

    forward.addUniformTextures( 'samplerChar', GL_TEXTURE_2D, codeCharTexture );

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

      promiseGui.then( ( gui ) => {
        gui.input( 'Code/active', true )?.on( 'change', ( { value } ) => {
          quad.active = value;
        } );
      } );
    }

    // -- lambda -----------------------------------------------------------------------------------
    let scrollCurrent = 0.0;
    let scrollTarget = 0.0;

    const lambdaScroll = new Lambda( {
      onUpdate( { deltaTime } ) {
        scrollCurrent += ( 1.0 - Math.exp( -10.0 * deltaTime ) ) * ( scrollTarget - scrollCurrent );
        forward.addUniform( 'scroll', '1f', scrollCurrent );
      }
    } );

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
          arrayChars[ head ++ ] = line.charCodeAt( iCol ); // char
          arrayChars[ head ++ ] = time; // spawn time
        } );
      } );
      arrayChars.fill( 0, head );

      gl.bindBuffer( GL_ARRAY_BUFFER, bufferChars );
      gl.bufferData( GL_ARRAY_BUFFER, arrayChars, GL_DYNAMIC_DRAW );
      gl.bindBuffer( GL_ARRAY_BUFFER, null );

      scrollTarget = shaderEventManager.select[ 2 ];
    };

    // -- components -------------------------------------------------------------------------------
    this.children = [
      lambdaScroll,
      quad,
    ];
  }
}
