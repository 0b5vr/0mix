import { Component, ComponentOptions, ComponentUpdateEvent } from './Component';
import { GLCullFaceType } from '../../gl/GLCullFaceType';
import { GL_CULL_FACE, GL_DEPTH_TEST, GL_NONE } from '../../gl/constants';
import { Geometry } from '../Geometry';
import { Material } from '../Material';
import { RenderTarget } from '../RenderTarget';
import { gl } from '../../globals/canvas';
import { glClear } from '../../gl/glClear';
import { quadGeometry } from '../../globals/quadGeometry';

export interface QuadOptions extends ComponentOptions {
  geometry?: Geometry;
  material?: Material;
  target?: RenderTarget;
  range?: [ number, number, number, number ];
  clear?: Array<number | undefined> | false;

  /**
   * `GL_NONE` is accepted to disable culling.
   *
   * @default GL_NONE
   */
  cull?: typeof GL_NONE | GLCullFaceType;
  depthWrite?: boolean;
  depthTest?: boolean;
}

/**
 * Renders a fullscreen quad.
 */
export class Quad extends Component {
  public material?: Material;
  public target?: RenderTarget;
  public range: [ number, number, number, number ];
  public clear: Array<number | undefined> | false;
  public geometry: Geometry;

  /**
   * `GL_NONE` is accepted to disable culling.
   *
   * @default GL_NONE
   */
  public cull: typeof GL_NONE | GLCullFaceType;
  public depthWrite: boolean;
  public depthTest: boolean;

  public constructor( options?: QuadOptions ) {
    super( options );

    this.visible = false;

    this.material = options?.material;
    this.geometry = options?.geometry ?? quadGeometry;
    this.target = options?.target;
    this.range = options?.range ?? [ -1.0, -1.0, 1.0, 1.0 ];
    this.clear = options?.clear ?? false;
    this.cull = options?.cull ?? GL_NONE;
    this.depthWrite = options?.depthWrite ?? true;
    this.depthTest = options?.depthTest ?? true;
  }

  public drawImmediate( event?: Partial<ComponentUpdateEvent> ): void {
    const { target, material, geometry } = this;

    if ( !target || !material ) {
      throw import.meta.env.DEV && new Error( 'Quad: You must assign target and material before draw' );
    }

    const program = material.program;

    if ( !program ) { return; }

    target.bind();

    gl.useProgram( program );
    material.setBlendMode();

    if ( this.cull === GL_NONE ) {
      gl.disable( GL_CULL_FACE );
    } else {
      gl.enable( GL_CULL_FACE );
      gl.cullFace( this.cull );
    }

    if ( this.depthTest ) {
      gl.enable( GL_DEPTH_TEST );
    } else {
      gl.disable( GL_DEPTH_TEST );
    }

    gl.depthMask( this.depthWrite );

    if ( this.clear ) {
      glClear( ...this.clear );
    }

    material.addUniform( 'time', '1f', event?.time ?? 0.0 );
    material.addUniform( 'deltaTime', '1f', event?.deltaTime ?? 0.0 );
    material.addUniform( 'frameCount', '1f', event?.frameCount ?? 0 );
    material.addUniform( 'resolution', '2f', target.width, target.height );
    material.addUniform( 'aspect', '1f', target.width / target.height );
    material.addUniform( 'range', '4f', ...this.range );

    material.setUniforms();

    geometry.draw();
  }

  protected __updateImpl( event: ComponentUpdateEvent ): void {
    this.drawImmediate( event );
  }
}
