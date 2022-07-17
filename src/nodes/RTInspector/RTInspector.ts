import { Blit } from '../../heck/components/Blit';
import { BufferTextureRenderTarget } from '../../heck/BufferTextureRenderTarget';
import { CanvasTexture } from '../utils/CanvasTexture';
import { Component } from '../../heck/components/Component';
import { GL_COLOR_ATTACHMENT0, GL_ONE_MINUS_SRC_ALPHA, GL_SRC_ALPHA, GL_TEXTURE_2D } from '../../gl/constants';
import { Lambda } from '../../heck/components/Lambda';
import { Material } from '../../heck/Material';
import { Quad } from '../../heck/components/Quad';
import { RawBufferRenderTarget } from '../../heck/RawBufferRenderTarget';
import { RenderTarget } from '../../heck/RenderTarget';
import { SceneNode } from '../../heck/components/SceneNode';
import { canvas } from '../../globals/canvas';
import { dryFrag } from '../../shaders/common/dryFrag';
import { dummyRenderTarget1 } from '../../globals/dummyRenderTarget';
import { gui } from '../../globals/gui';
import { quadGeometry } from '../../globals/quadGeometry';
import { quadVert } from '../../shaders/common/quadVert';
import { traverse } from '@0b5vr/experimental';
import inspectorFrag from './shaders/inspector.frag?raw';

export interface RTInspectorOptions {
  target: RenderTarget;
}

export class RTInspector extends SceneNode {
  public nodeSingle: SceneNode;
  public nodeMultiple: SceneNode;
  public materialSingle: Material;
  public quadSingle: Quad;
  public blitsMultiple: Blit[];

  public constructor( { target }: RTInspectorOptions ) {
    super();

    this.visible = false;

    // -- single -----------------------------------------------------------------------------------
    this.nodeSingle = new SceneNode( {
      name: 'nodeSingle',
    } );
    this.children.push( this.nodeSingle );

    this.materialSingle = new Material(
      quadVert,
      inspectorFrag,
      { initOptions: { target: dummyRenderTarget1, geometry: quadGeometry } },
    );

    this.quadSingle = new Quad( {
      target: target,
      material: this.materialSingle,
      name: 'quadSingle',
    } );
    this.nodeSingle.children.push( this.quadSingle );

    // -- mouse listener ---------------------------------------------------------------------------
    canvas.addEventListener( 'mousemove', ( { offsetX, offsetY } ) => {
      const rect = canvas.getBoundingClientRect();
      const x = offsetX / rect.width;
      const y = 1.0 - offsetY / rect.height;

      this.materialSingle.addUniform( 'mouse', '2f', x, y );
    } );

    // -- multiple ---------------------------------------------------------------------------------
    this.nodeMultiple = new SceneNode( {
      name: 'nodeMultiple',
    } );
    this.children.push( this.nodeMultiple );

    // count first?
    let count = 0;
    for ( const src of RawBufferRenderTarget.nameMap.values() ) {
      count += src.numBuffers;
    }

    // grid
    const grid = Math.ceil( Math.sqrt( count ) );
    const width = Math.floor( target.width / grid );
    const height = Math.floor( target.height / grid );

    // determine grid positions
    const entries: {
      src: RawBufferRenderTarget;
      attachment: GLenum;
      dstRect: [ number, number, number, number ];
      name: string;
    }[] = [];

    let iBlit = 0;
    for ( const src of RawBufferRenderTarget.nameMap.values() ) {
      for ( let iAttachment = 0; iAttachment < src.numBuffers; iAttachment ++ ) {
        const x = iBlit % grid;
        const y = grid - 1 - Math.floor( iBlit / grid );
        const dstRect: [ number, number, number, number ] = [
          width * x,
          height * y,
          width * ( x + 1.0 ),
          height * ( y + 1.0 ),
        ];

        let name = `${ src.name }`;
        if ( src.numBuffers > 1 ) {
          name += `[${ iAttachment }]`;
        }

        entries.push( {
          src,
          attachment: GL_COLOR_ATTACHMENT0 + iAttachment,
          dstRect,
          name,
        } );

        iBlit ++;
      }
    }

    // then add blits + render names to canvas
    this.blitsMultiple = [];
    for ( const { src, attachment, dstRect, name } of entries ) {
      const blit = new Blit( {
        src,
        dst: target,
        attachment,
        dstRect,
        name,
      } );

      this.blitsMultiple.push( blit );
      this.nodeMultiple.children.push( blit );
    }

    // text canvas
    const textureText = new CanvasTexture( target.width, target.height );

    this.nodeMultiple.children.push( new Lambda( {
      onUpdate: () => {
        const context = textureText.context;

        textureText.clear();

        context.font = '500 10px Wt-Position';
        context.fillStyle = '#fff';
        context.lineWidth = 2;
        context.strokeStyle = '#000';

        for ( const { dstRect, name } of entries ) {
          context.strokeText( name, dstRect[ 0 ], target.height - dstRect[ 1 ] );
          context.fillText( name, dstRect[ 0 ], target.height - dstRect[ 1 ] );
        }

        textureText.updateTexture();
      },
      name: 'lambdaUpdateTextCanvas',
    } ) );

    const materialMultipleText = new Material(
      quadVert,
      dryFrag,
      {
        initOptions: { target: dummyRenderTarget1, geometry: quadGeometry },
        blend: [ GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA ],
      },
    );
    materialMultipleText.addUniformTextures( 'sampler0', GL_TEXTURE_2D, textureText.texture );

    const quadMultipleText = new Quad( {
      target: target,
      material: materialMultipleText,
      name: 'quadMultipleText',
      range: [ -1.0, 1.0, 1.0, -1.0 ],
    } );
    this.nodeMultiple.children.push( quadMultipleText );

    // -- see the config ---------------------------------------------------------------------------
    this.children.push( new Lambda( {
      onUpdate: () => {
        this.__updateTarget();
      },
      name: 'lambdaUpdateTarget',
    } ) );

    // -- set ignoreBreakpoiints -------------------------------------------------------------------
    traverse<Component>( this, ( node ) => {
      node.ignoreBreakpoints = true;

      if ( node instanceof SceneNode ) {
        return node.children;
      } else {
        return [];
      }
    } );
  }

  private __updateTarget(): void {
    const ha = gui; // FIXME: weird error that prevents me using optional chaining...

    const single: string = ha?.value( 'RTInspector/single', '' ) ?? '';
    const singleIndex: number = ha?.value( 'RTInspector/index', 0, { step: 1 } ) ?? 0;

    this.materialSingle.addUniform(
      'lod',
      '1f',
      ha?.value( 'RTInspector/lod', 0, { step: 1 } ) ?? 0.0,
    );

    if ( ha?.value( 'RTInspector/multiple', false ) ) {
      this.nodeMultiple.active = true;
      this.nodeSingle.active = false;
    } else if ( single !== '' ) {
      this.nodeMultiple.active = false;

      for ( const [ name, target ] of RawBufferRenderTarget.nameMap ) {
        if ( !( new RegExp( single ).test( name ) ) ) { continue; }
        if ( !( target instanceof BufferTextureRenderTarget ) ) { continue; } // TODO

        const texture = target?.textures[ singleIndex ];

        if ( !texture ) {
          this.nodeSingle.active = false;
          return;
        }

        this.materialSingle.addUniformTextures( 'sampler0', GL_TEXTURE_2D, texture );

        this.nodeSingle.active = true;
      }
    } else {
      // fallback to not render it
      this.nodeMultiple.active = false;
      this.nodeSingle.active = false;
    }
  }
}
