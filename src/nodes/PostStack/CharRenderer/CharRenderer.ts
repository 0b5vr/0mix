import { GL_DYNAMIC_DRAW, GL_TRIANGLE_STRIP, GL_ONE, GL_ONE_MINUS_SRC_ALPHA, GL_TEXTURE_2D, GL_ARRAY_BUFFER } from '../../../gl/constants';
import { glCreateVertexbuffer } from '../../../gl/glCreateVertexbuffer';
import { glVertexArrayBindVertexbuffer } from '../../../gl/glVertexArrayBindVertexbuffer';
import { gl } from '../../../globals/canvas';
import { dummyRenderTarget1 } from '../../../globals/dummyRenderTarget';
import { promiseGui } from '../../../globals/gui';
import { music } from '../../../globals/music';
import { quadBuffer } from '../../../globals/quadGeometry';
import { Lambda } from '../../../heck/components/Lambda';
import { Quad } from '../../../heck/components/Quad';
import { SceneNode } from '../../../heck/components/SceneNode';
import { Geometry } from '../../../heck/Geometry';
import { Material } from '../../../heck/Material';
import { RenderTarget } from '../../../heck/RenderTarget';
import { ShaderEventRange } from '../../../music/ShaderEventRange';
import { withinShaderEventRange } from '../../../music/withinShaderEventRange';
import { GLSLExpression } from '../../../shaders/shaderBuilder';
import { codeCharTexture } from './codeCharTexture';
import { codeRenderFrag } from './shaders/codeRenderFrag';
import { codeRenderVert } from './shaders/codeRenderVert';

interface CharRendererOptions {
  target: RenderTarget;
  chars: number;
  anchor: GLSLExpression<'vec2'>;
  offset: GLSLExpression<'vec2'>;
  textAlign?: number;
  textBaseline?: number;
}

export class CharRenderer extends SceneNode {
  public scrollTarget: number;
  public arrayChars: Float32Array;
  public bufferChars: WebGLBuffer;
  public textAlign: number;
  public textBaseline: number;

  public constructor( {
    target,
    chars,
    anchor,
    offset,
    textAlign,
    textBaseline,
  }: CharRendererOptions ) {
    super();

    this.textAlign = textAlign ?? 0.0;
    this.textBaseline = textBaseline ?? 0.0;

    // -- geometry render --------------------------------------------------------------------------
    const geometry = new Geometry();

    glVertexArrayBindVertexbuffer( geometry.vao, quadBuffer, 0, 2 );

    this.arrayChars = new Float32Array( 4 * chars );
    this.bufferChars = glCreateVertexbuffer( this.arrayChars, GL_DYNAMIC_DRAW );

    glVertexArrayBindVertexbuffer( geometry.vao, this.bufferChars, 1, 4, 1 );

    geometry.count = 4;
    geometry.primcount = chars;
    geometry.mode = GL_TRIANGLE_STRIP;

    // -- material render --------------------------------------------------------------------------
    const forward = new Material(
      codeRenderVert( anchor, offset ),
      codeRenderFrag,
      {
        initOptions: { geometry, target: dummyRenderTarget1 },
        blend: [ GL_ONE, GL_ONE_MINUS_SRC_ALPHA ],
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
            v?.codeRenderVert( anchor, offset ),
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
    this.scrollTarget = 0.0;

    const lambdaScroll = new Lambda( {
      onUpdate: ( { deltaTime } ) => {
        scrollCurrent += ( 1.0 - Math.exp( -10.0 * deltaTime ) ) * ( this.scrollTarget - scrollCurrent );
        forward.addUniform( 'scroll', '1f', scrollCurrent );
      }
    } );

    // -- components -------------------------------------------------------------------------------
    this.children = [
      lambdaScroll,
      quad,
    ];
  }

  setContent( content: string[], changeRange?: ShaderEventRange, selectRange?: ShaderEventRange ) {
    const { arrayChars, bufferChars, textAlign, textBaseline } = this;
    let head = 0;

    const baselineOffset = ( 1 - content.length ) * textBaseline;
    content.map( ( line, iLine ) => {
      const alignOffset = ( 1 - line.length ) * textAlign;
      line.split( '' ).map( ( char, iCol ) => {
        let time = -1E9;

        if ( changeRange && withinShaderEventRange( changeRange, iLine, iCol ) ) {
          time = music.time;
        }

        if ( selectRange && withinShaderEventRange( selectRange, iLine, iCol ) ) {
          time = 1E9;
        }

        arrayChars[ head ++ ] = iCol + alignOffset; // x
        arrayChars[ head ++ ] = iLine + baselineOffset; // y
        arrayChars[ head ++ ] = char.charCodeAt( 0 ); // char
        arrayChars[ head ++ ] = time; // spawn time
      } );
    } );
    arrayChars.fill( 0, head );

    gl.bindBuffer( GL_ARRAY_BUFFER, bufferChars );
    gl.bufferData( GL_ARRAY_BUFFER, arrayChars, GL_DYNAMIC_DRAW );
    gl.bindBuffer( GL_ARRAY_BUFFER, null );
  }
}
