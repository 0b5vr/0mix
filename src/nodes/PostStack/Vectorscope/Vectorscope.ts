import { CharRenderer } from '../CharRenderer/CharRenderer';
import { GLTextureFormatStuffR32F, glSetTexture } from '../../../gl/glSetTexture';
import { GL_NEAREST, GL_ONE, GL_POINTS, GL_TEXTURE_2D } from '../../../gl/constants';
import { Geometry } from '../../../heck/Geometry';
import { Material } from '../../../heck/Material';
import { Quad } from '../../../heck/components/Quad';
import { RenderTarget } from '../../../heck/RenderTarget';
import { SceneNode } from '../../../heck/components/SceneNode';
import { arraySerial } from '@0b5vr/experimental';
import { audioAnalyzerObservers, editorVisibleObservers } from '../../../globals/globalObservers';
import { audioAnalyzerTimeDomainL, audioAnalyzerTimeDomainR } from '../../../globals/audioAnalyzer';
import { dummyRenderTarget1 } from '../../../globals/dummyRenderTarget';
import { glCreateTexture } from '../../../gl/glCreateTexture';
import { glCreateVertexbuffer } from '../../../gl/glCreateVertexbuffer';
import { glTextureFilter } from '../../../gl/glTextureFilter';
import { glVertexArrayBindVertexbuffer } from '../../../gl/glVertexArrayBindVertexbuffer';
import { vec2 } from '../../../shaders/shaderBuilder';
import { vectorscopeFrag } from './shaders/vectorscopeFrag';
import { vectorscopeVert } from './shaders/vectorscopeVert';

export class Vectorscope extends SceneNode {
  public constructor( target: RenderTarget ) {
    super();

    // -- bg ---------------------------------------------------------------------------------------
    const bg = new CharRenderer( {
      target,
      chars: 42,
      anchor: vec2( 1.0, 1.0 ),
      offset: vec2( -4.0, 4.0 ),
      textAlign: 1.0,
      textBaseline: 0.0,
    } );

    bg.setContent( arraySerial( 6 ).map( () => '       ' ) );

    // -- data -------------------------------------------------------------------------------------
    const textureL = glCreateTexture( 1024, 1, null );
    const textureR = glCreateTexture( 1024, 1, null );

    glTextureFilter( textureL, GL_NEAREST );
    glTextureFilter( textureR, GL_NEAREST );

    audioAnalyzerObservers.push( () => {
      glSetTexture( textureL, 1024, 1, audioAnalyzerTimeDomainL, GLTextureFormatStuffR32F );
      glSetTexture( textureR, 1024, 1, audioAnalyzerTimeDomainR, GLTextureFormatStuffR32F );
    } );

    // -- geometry ---------------------------------------------------------------------------------
    const geometry = new Geometry();
    geometry.count = 1024;
    geometry.mode = GL_POINTS;

    const bufferInstanceArray = new Float32Array( arraySerial( 1024 ) );
    const bufferInstance = glCreateVertexbuffer( bufferInstanceArray );

    glVertexArrayBindVertexbuffer( geometry.vao, bufferInstance, 0, 1 );
    glVertexArrayBindVertexbuffer( geometry.vao, bufferInstance, 1, 1, 1 );

    // -- material ---------------------------------------------------------------------------------
    const material = new Material(
      vectorscopeVert,
      vectorscopeFrag,
      {
        initOptions: { geometry, target: dummyRenderTarget1 },
        blend: [ GL_ONE, GL_ONE ],
      },
    );

    material.addUniformTextures( 'samplerL', GL_TEXTURE_2D, textureL );
    material.addUniformTextures( 'samplerR', GL_TEXTURE_2D, textureR );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        [
          './shaders/vectorscopeVert',
          './shaders/vectorscopeFrag',
        ],
        ( [ v, f ] ) => {
          material.replaceShader(
            v?.vectorscopeVert,
            f?.vectorscopeFrag,
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

    editorVisibleObservers.push( ( active ) => quad.active = active );

    if ( import.meta.env.DEV ) {
      quad.name = 'quad';
    }

    // -- children ---------------------------------------------------------------------------------
    this.children = [
      bg,
      quad,
    ];
  }
}
