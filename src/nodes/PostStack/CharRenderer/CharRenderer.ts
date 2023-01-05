import { GLSLExpression } from '../../../shaders/shaderBuilder';
import { GL_ARRAY_BUFFER, GL_DYNAMIC_DRAW, GL_ONE, GL_ONE_MINUS_SRC_ALPHA, GL_TEXTURE_2D, GL_TRIANGLE_STRIP } from '../../../gl/constants';
import { Geometry } from '../../../heck/Geometry';
import { Lambda } from '../../../heck/components/Lambda';
import { Material } from '../../../heck/Material';
import { Quad } from '../../../heck/components/Quad';
import { RenderTarget } from '../../../heck/RenderTarget';
import { SceneNode } from '../../../heck/components/SceneNode';
import { ShaderEventRange } from '../../../music/ShaderEventRange';
import { charRendererFrag } from './shaders/charRendererFrag';
import { charRendererVert } from './shaders/charRendererVert';
import { codeCharTexture } from './codeCharTexture';
import { dummyRenderTarget1 } from '../../../globals/dummyRenderTarget';
import { gl } from '../../../globals/canvas';
import { glCreateVertexbuffer } from '../../../gl/glCreateVertexbuffer';
import { glVertexArrayBindVertexbuffer } from '../../../gl/glVertexArrayBindVertexbuffer';
import { music } from '../../../globals/music';
import { promiseGui } from '../../../globals/gui';
import { quadBuffer } from '../../../globals/quadGeometry';
import { withinShaderEventRange } from '../../../music/withinShaderEventRange';

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
      charRendererVert( anchor, offset ),
      charRendererFrag,
      {
        initOptions: { geometry, target: dummyRenderTarget1 },
        blend: [ GL_ONE, GL_ONE_MINUS_SRC_ALPHA ],
      },
    );

    forward.addUniformTextures( 'samplerChar', GL_TEXTURE_2D, codeCharTexture );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        [
          './shaders/charRendererVert',
          './shaders/charRendererFrag',
        ],
        ( [ v, f ] ) => {
          forward.replaceShader(
            v?.charRendererVert( anchor, offset ),
            f?.charRendererFrag,
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
        const delta = this.scrollTarget - scrollCurrent;
        scrollCurrent += ( 1.0 - Math.exp( -10.0 * deltaTime ) ) * delta;
        forward.addUniform( 'scroll', '1f', scrollCurrent );
      }
    } );

    // -- components -------------------------------------------------------------------------------
    this.children = [
      lambdaScroll,
      quad,
    ];
  }

  public setContent(
    content: string[],
    changeRange?: ShaderEventRange,
    selectRange?: ShaderEventRange,
  ): void {
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
