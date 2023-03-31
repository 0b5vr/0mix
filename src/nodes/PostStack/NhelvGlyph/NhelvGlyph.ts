import { GL_ONE } from '../../../gl/constants';
import { Material } from '../../../heck/Material';
import { Quad } from '../../../heck/components/Quad';
import { RenderTarget } from '../../../heck/RenderTarget';
import { SceneNode } from '../../../heck/components/SceneNode';
import { auto } from '../../../globals/automaton';
import { dummyRenderTarget1 } from '../../../globals/dummyRenderTarget';
import { nhelvGlyphFrag } from './shaders/nhelvGlyphFrag';
import { quadGeometry } from '../../../globals/quadGeometry';
import { quadVert } from '../../../shaders/common/quadVert';

export interface NhelvGlyphOptions {
  target: RenderTarget;
}

export class NhelvGlyph extends SceneNode {
  public constructor( options: NhelvGlyphOptions ) {
    super();

    this.visible = false;

    // -- post -------------------------------------------------------------------------------------
    const material = new Material(
      quadVert,
      nhelvGlyphFrag,
      {
        initOptions: { geometry: quadGeometry, target: dummyRenderTarget1 },
        blend: [ GL_ONE, GL_ONE ],
      },
    );

    if ( import.meta.hot ) {
      import.meta.hot.accept( './shaders/nhelvGlyphFrag', ( { nhelvGlyphFrag } ) => {
        material.replaceShader( quadVert, nhelvGlyphFrag );
      } );
    }

    const quad = new Quad( {
      target: options.target,
      material,
    } );

    if ( import.meta.env.DEV ) {
      quad.name = 'quad';
    }

    // -- auto -------------------------------------------------------------------------------------
    auto( 'NhelvGlyph/alpha', ( { value } ) => (
      material.addUniform( 'alpha', '1f', value )
    ) );

    auto( 'NhelvGlyph/seed', ( { value } ) => (
      material.addUniform( 'seed', '1f', value )
    ) );

    this.children.push( quad );
  }
}
