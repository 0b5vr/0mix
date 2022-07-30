import { BufferTextureRenderTarget } from '../../heck/BufferTextureRenderTarget';
import { Component } from '../../heck/components/Component';
import { GL_TEXTURE_2D } from '../../gl/constants';
import { Lambda } from '../../heck/components/Lambda';
import { Material } from '../../heck/Material';
import { Quad } from '../../heck/components/Quad';
import { RTInspectorMultiple } from './RTInspectorMultiple';
import { RawBufferRenderTarget } from '../../heck/RawBufferRenderTarget';
import { RenderTarget } from '../../heck/RenderTarget';
import { SceneNode } from '../../heck/components/SceneNode';
import { canvas } from '../../globals/canvas';
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
      target,
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
    this.nodeMultiple = new RTInspectorMultiple( { target } );
    this.children.push( this.nodeMultiple );

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
