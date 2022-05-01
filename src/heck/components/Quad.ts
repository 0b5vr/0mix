import { Component, ComponentOptions, ComponentUpdateEvent } from './Component';
import { Material } from '../Material';
import { RenderTarget } from '../RenderTarget';
import { gl } from '../../globals/canvas';
import { quadGeometry } from '../../globals/quadGeometry';
import { glClear } from '../../gl/glClear';
import { GL_CULL_FACE, GL_DEPTH_TEST } from '../../gl/constants';

export interface QuadOptions extends ComponentOptions {
  material?: Material;
  target?: RenderTarget;
  range?: [ number, number, number, number ];
  clear?: Array<number | undefined> | false;
}

/**
 * Renders a fullscreen quad.
 */
export class Quad extends Component {
  public material?: Material;
  public target?: RenderTarget;
  public range: [ number, number, number, number ] = [ -1.0, -1.0, 1.0, 1.0 ];
  public clear: Array<number | undefined> | false;

  public constructor( options?: QuadOptions ) {
    super( options );

    this.visible = false;

    this.material = options?.material;
    this.target = options?.target;
    this.range = options?.range ?? [ -1.0, -1.0, 1.0, 1.0 ];
    this.clear = options?.clear ?? false;
  }

  public drawImmediate( event?: Partial<ComponentUpdateEvent> ): void {
    const { target, material } = this;

    if ( !target || !material ) {
      throw import.meta.env.DEV && new Error( 'Quad: You must assign target and material before draw' );
    }

    const program = material.program;

    if ( !program ) { return; }

    gl.useProgram( program );

    target.bind();
    material.setBlendMode();

    gl.disable( GL_CULL_FACE );
    gl.enable( GL_DEPTH_TEST );
    gl.depthMask( true );

    if ( this.clear ) {
      glClear( ...this.clear );
    }

    material.addUniform( 'time', '1f', event?.time ?? 0.0 );
    material.addUniform( 'deltaTime', '1f', event?.deltaTime ?? 0.0 );
    material.addUniform( 'frameCount', '1f', event?.frameCount ?? 0 );
    material.addUniform( 'resolution', '2f', target.width, target.height );
    material.addUniform( 'range', '4f', ...this.range );

    material.setUniforms();

    quadGeometry.draw();
  }

  protected __updateImpl( event: ComponentUpdateEvent ): void {
    this.drawImmediate( event );
  }
}
