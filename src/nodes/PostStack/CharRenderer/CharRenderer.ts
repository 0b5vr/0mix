import { CDS } from '@0b5vr/experimental';
import { GLSLExpression } from '../../../shaders/shaderBuilder';
import { GLSLMusicEditorRange } from '../../../music/GLSLMusicEditorRange';
import { GL_ARRAY_BUFFER, GL_DYNAMIC_DRAW, GL_ONE, GL_ONE_MINUS_SRC_ALPHA, GL_TEXTURE_2D, GL_TRIANGLE_STRIP } from '../../../gl/constants';
import { Geometry } from '../../../heck/Geometry';
import { Lambda } from '../../../heck/components/Lambda';
import { Material } from '../../../heck/Material';
import { Quad } from '../../../heck/components/Quad';
import { RenderTarget } from '../../../heck/RenderTarget';
import { SceneNode } from '../../../heck/components/SceneNode';
import { charRendererFrag } from './shaders/charRendererFrag';
import { charRendererVert } from './shaders/charRendererVert';
import { codeCharTexture } from './codeCharTexture';
import { dummyRenderTarget1 } from '../../../globals/dummyRenderTarget';
import { gl } from '../../../globals/canvas';
import { glCreateVertexbuffer } from '../../../gl/glCreateVertexbuffer';
import { glVertexArrayBindVertexbuffer } from '../../../gl/glVertexArrayBindVertexbuffer';
import { promiseGui } from '../../../globals/gui';
import { quadBuffer } from '../../../globals/quadGeometry';
import { withinGLSLMusicEditorRange } from '../../../music/withinGLSLMusicEditorRange';

enum CharRendererToken {
  Selected,
  Text,
  Comment,
  Statement,
  Number,
  Type,
  Name,
}

interface CharRendererOptions {
  target: RenderTarget;
  chars: number;
  anchor: GLSLExpression<'vec2'>;
  offset: GLSLExpression<'vec2'>;
  textAlign?: number;
  textBaseline?: number;
  useSyntaxHighlight?: boolean;
}

export class CharRenderer extends SceneNode {
  public scrollTarget: number;
  public arrayChars: Float32Array;
  public bufferChars: WebGLBuffer;
  public textAlign: number;
  public textBaseline: number;
  public useSyntaxHighlight: boolean;

  public constructor( {
    target,
    chars,
    anchor,
    offset,
    textAlign,
    textBaseline,
    useSyntaxHighlight,
  }: CharRendererOptions ) {
    super();

    this.textAlign = textAlign ?? 0.0;
    this.textBaseline = textBaseline ?? 0.0;
    this.useSyntaxHighlight = useSyntaxHighlight!;

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
    const material = new Material(
      charRendererVert( anchor, offset ),
      charRendererFrag,
      {
        initOptions: { geometry, target: dummyRenderTarget1 },
        blend: [ GL_ONE, GL_ONE_MINUS_SRC_ALPHA ],
      },
    );

    material.addUniformTextures( 'samplerChar', GL_TEXTURE_2D, codeCharTexture );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        [
          './shaders/charRendererVert',
          './shaders/charRendererFrag',
        ],
        ( [ v, f ] ) => {
          material.replaceShader(
            v?.charRendererVert( anchor, offset ),
            f?.charRendererFrag,
          );
        },
      );
    }

    // -- quad -------------------------------------------------------------------------------------
    const quad = new Quad( {
      geometry,
      material,
      target,
      depthTest: false,
      depthWrite: false,
    } ); // TODO: Quad???

    if ( import.meta.env.DEV ) {
      quad.name = 'quad';

      promiseGui.then( ( gui ) => {
        gui.input( 'Code/active', true )?.on( 'change', ( { value } ) => {
          quad.active = value;
        } );
      } );
    }

    // -- lambda -----------------------------------------------------------------------------------
    const cdsScroll = new CDS();
    this.scrollTarget = 0.0;

    const lambdaScroll = new Lambda( {
      onUpdate: ( { deltaTime } ) => {
        cdsScroll.target = this.scrollTarget;
        cdsScroll.update( deltaTime );
        material.addUniform( 'scroll', '1f', cdsScroll.value );
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
    selectRange?: GLSLMusicEditorRange,
  ): void {
    const { arrayChars, bufferChars, textAlign, textBaseline } = this;
    let head = 0;

    const baselineOffset = ( 1 - content.length ) * textBaseline;
    content.map( ( line, iLine ) => {
      const alignOffset = ( 1 - line.length ) * textAlign;

      let token: CharRendererToken = CharRendererToken.Text;
      let tokenLife = 0;

      line.split( '' ).map( ( char, iCol ) => {
        if ( this.useSyntaxHighlight ) {
          if ( line.substring( iCol, iCol + 2 ) === '//' ) {
            token = CharRendererToken.Comment;
          }

          if ( iCol === 0 && char === '#' ) {
            token = CharRendererToken.Statement;
          }

          ( [
            [ CharRendererToken.Statement, /^(\+|-|=|\*|\/|return|const|if|else|for)/ ],
            [ CharRendererToken.Number, /^(0x[0-9a-f]+(u)?|\d*\.\d+(e\d+)?|\d+\.\d*|\d+(e\d+)?(u)?)/ ],
            [ CharRendererToken.Type, /^(floatBitsToUint|float|(u|i)?vec(2|3|4)|int|uint|mat(2|3|4)|exp2?|sqrt|pow|max|a?sin|a?cos|a?tanh?|mod|floor|cross|dot|normalize|smoothstep)(?=[ (])/ ],
            [ CharRendererToken.Name, /^[a-zA-Z_][a-zA-Z0-9_]*/ ],
          ] as [ CharRendererToken, RegExp ][] ).map( ( [ t, re ] ) => {
            if ( token === CharRendererToken.Text ) {
              const m = line.substring( iCol ).match( re );
              if ( m ) {
                token = t;
                tokenLife = m[ 0 ].length;
              }
            }
          } );
        }

        let charToken = token;
        if ( selectRange && withinGLSLMusicEditorRange( selectRange, iLine, iCol ) ) {
          charToken = CharRendererToken.Selected;
        }

        arrayChars[ head ++ ] = iCol + alignOffset; // x
        arrayChars[ head ++ ] = iLine + baselineOffset; // y
        arrayChars[ head ++ ] = char.charCodeAt( 0 ); // char
        arrayChars[ head ++ ] = charToken; // token kind

        if ( -- tokenLife === 0 ) {
          token = CharRendererToken.Text;
        }
      } );
    } );
    arrayChars.fill( 0, head );

    gl.bindBuffer( GL_ARRAY_BUFFER, bufferChars );
    gl.bufferData( GL_ARRAY_BUFFER, arrayChars, GL_DYNAMIC_DRAW );
    gl.bindBuffer( GL_ARRAY_BUFFER, null );
  }
}
