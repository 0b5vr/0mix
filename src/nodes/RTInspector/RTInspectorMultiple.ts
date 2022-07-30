import { Blit } from '../../heck/components/Blit';
import { CanvasTexture } from '../utils/CanvasTexture';
import { EventType, on } from '../../globals/globalEvent';
import { GL_COLOR_ATTACHMENT0, GL_ONE, GL_ONE_MINUS_SRC_ALPHA, GL_TEXTURE_2D } from '../../gl/constants';
import { Lambda } from '../../heck/components/Lambda';
import { Material } from '../../heck/Material';
import { Quad } from '../../heck/components/Quad';
import { RawBufferRenderTarget } from '../../heck/RawBufferRenderTarget';
import { RenderTarget } from '../../heck/RenderTarget';
import { SceneNode } from '../../heck/components/SceneNode';
import { dryFrag } from '../../shaders/common/dryFrag';
import { dummyRenderTarget1 } from '../../globals/dummyRenderTarget';
import { quadGeometry } from '../../globals/quadGeometry';
import { quadVert } from '../../shaders/common/quadVert';

export interface RTInspectorMultipleOptions {
  target: RenderTarget;
}

export class RTInspectorMultiple extends SceneNode {
  public constructor( options: RTInspectorMultipleOptions ) {
    super();

    const { target } = options;

    const nodeBlits = new SceneNode( { name: 'blits' } );

    const textureText = new CanvasTexture( 4, 4 );

    on( EventType.Resize, ( [ width, height ] ) => {
      textureText.canvas.width = width;
      textureText.canvas.height = height;
    } );

    const materialMultipleText = new Material(
      quadVert,
      dryFrag,
      {
        initOptions: { target: dummyRenderTarget1, geometry: quadGeometry },
        blend: [ GL_ONE, GL_ONE_MINUS_SRC_ALPHA ],
      },
    );
    materialMultipleText.addUniformTextures( 'sampler0', GL_TEXTURE_2D, textureText.texture );

    const quadMultipleText = new Quad( {
      target: target,
      material: materialMultipleText,
      name: 'quadMultipleText',
      range: [ -1.0, 1.0, 1.0, -1.0 ],
    } );

    // -- lambda update ----------------------------------------------------------------------------
    const lambdaUpdate = new Lambda( {
      onUpdate: () => {
        // count buffers
        let count = 0;
        for ( const src of RawBufferRenderTarget.nameMap.values() ) {
          count += src.numBuffers;
        }

        // create grid
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

        for ( const src of RawBufferRenderTarget.nameMap.values() ) {
          for ( let iAttachment = 0; iAttachment < src.numBuffers; iAttachment ++ ) {
            const x = entries.length % grid;
            const y = grid - 1 - Math.floor( entries.length / grid );
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
          }
        }

        // add / update blits
        for ( const [ i, { src, attachment, dstRect, name } ] of entries.entries() ) {
          if ( i >= nodeBlits.children.length ) {
            nodeBlits.children[ i ] = new Blit( { dst: target } );
          }

          const blit = nodeBlits.children[ i ] as Blit;

          blit.src = src;
          blit.attachment = attachment;
          blit.dstRect = dstRect;
          blit.name = name;
        }

        // update text canvas
        {
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
        }
      },
    } );

    // -- children ---------------------------------------------------------------------------------
    this.children = [
      lambdaUpdate,
      nodeBlits,
      quadMultipleText,
    ];
  }
}
