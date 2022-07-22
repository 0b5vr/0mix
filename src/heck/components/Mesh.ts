import { Component, ComponentDrawEvent, ComponentOptions } from './Component';
import { GLCullFaceType } from '../../gl/GLCullFaceType';
import { GL_BACK, GL_CULL_FACE, GL_DEPTH_TEST, GL_NONE } from '../../gl/constants';
import { Geometry } from '../Geometry';
import { MaterialMap } from '../Material';
import { gl } from '../../globals/canvas';
import { mat3FromMat4Transpose, mat3Inverse } from '@0b5vr/experimental';

export interface MeshOptions extends ComponentOptions {
  geometry: Geometry;
  materials: MaterialMap;

  /**
   * `GL_NONE` is accepted to disable culling.
   *
   * @default GL_BACK
   */
  cull?: typeof GL_NONE | GLCullFaceType;
  depthWrite?: boolean;
  depthTest?: boolean;
}

export class Mesh extends Component {
  public geometry: Geometry;
  public materials: MaterialMap;

  /**
   * `GL_NONE` is accepted to disable culling.
   *
   * @default GL_BACK
   */
  public cull: typeof GL_NONE | GLCullFaceType;
  public depthWrite: boolean;
  public depthTest: boolean;

  public constructor( options: MeshOptions ) {
    super( options );

    this.active = false;

    this.geometry = options.geometry;
    this.materials = options.materials;
    this.cull = options.cull ?? GL_BACK;
    this.depthWrite = options.depthWrite ?? true;
    this.depthTest = options.depthTest ?? true;
  }

  protected __drawImpl( event: ComponentDrawEvent ): void {
    const material = this.materials[ event.materialTag ];
    if ( material == null ) {
      return;
    }

    const program = material.program;

    if ( !program ) { return; }

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

    material.addUniform( 'time', '1f', event.time );
    material.addUniform( 'frameCount', '1f', event.frameCount );
    material.addUniform( 'resolution', '2f', event.renderTarget.width, event.renderTarget.height );
    material.addUniform( 'cameraPos', '3f', ...event.cameraTransform.position );
    material.addUniform( 'cameraNearFar', '2f', event.camera.near, event.camera.far );

    const modelMatrixT3 = mat3FromMat4Transpose( event.globalTransform.matrix );
    material.addUniformMatrixVector(
      'normalMatrix',
      'Matrix3fv',
      mat3Inverse( modelMatrixT3 ),
    );
    material.addUniformMatrixVector(
      'modelMatrixT3',
      'Matrix3fv',
      modelMatrixT3,
    );

    material.addUniformMatrixVector( 'modelMatrix', 'Matrix4fv', event.globalTransform.matrix );
    material.addUniformMatrixVector( 'viewMatrix', 'Matrix4fv', event.viewMatrix );
    material.addUniformMatrixVector( 'projectionMatrix', 'Matrix4fv', event.projectionMatrix );

    material.setUniforms();

    this.geometry.draw();
  }
}
