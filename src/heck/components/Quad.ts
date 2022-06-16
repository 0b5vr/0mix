import { Component, ComponentOptions, ComponentUpdateEvent } from './Component';
import { Material } from '../Material';
import { RenderTarget } from '../RenderTarget';
import { gl } from '../../globals/canvas';
import { quadGeometry } from '../../globals/quadGeometry';
import { glClear } from '../../gl/glClear';
import { GL_CULL_FACE, GL_DEPTH_TEST } from '../../gl/constants';
import { Geometry } from '../Geometry';
import { MeshCull } from './Mesh';

export interface QuadOptions extends ComponentOptions {
  geometry?: Geometry;
  material?: Material;
  target?: RenderTarget;
  range?: [ number, number, number, number ];
  clear?: Array<number | undefined> | false;
}

const meshCullMap = {
  [ MeshCull.Front ]: /* GL_FRONT */ 1028,
  [ MeshCull.Back ]: /* GL_BACK */ 1029,
  [ MeshCull.Both ]: /* GL_FRONT_AND_BACK */ 1032
};

/**
 * Renders a fullscreen quad.
 */
export class Quad extends Component {
  public material?: Material;
  public target?: RenderTarget;
  public range: [ number, number, number, number ];
  public clear: Array<number | undefined> | false;
  public geometry: Geometry;
  public cull: MeshCull;
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
    this.cull = MeshCull.None;
    this.depthWrite = true;
    this.depthTest = false;
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

    if ( this.cull === MeshCull.None ) {
      gl.disable( GL_CULL_FACE );
    } else {
      gl.enable( GL_CULL_FACE );
      gl.cullFace( meshCullMap[ this.cull ] );
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
    material.addUniform( 'range', '4f', ...this.range );

    material.setUniforms();

    geometry.draw();
  }

  protected __updateImpl( event: ComponentUpdateEvent ): void {
    this.drawImmediate( event );
  }
}
