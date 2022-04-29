import { Component, ComponentDrawEvent, ComponentOptions } from './Component';
import { Geometry } from '../Geometry';
import { MaterialMap } from '../Material';
import { gl } from '../../globals/canvas';
import { mat3FromMat4Transpose, mat3Inverse } from '@0b5vr/experimental';
import { GL_CULL_FACE, GL_DEPTH_TEST } from '../../gl/constants';

export enum MeshCull {
  None,
  Front,
  Back,
  Both
}

const meshCullMap = {
  [ MeshCull.Front ]: /* GL_FRONT */ 1028,
  [ MeshCull.Back ]: /* GL_BACK */ 1029,
  [ MeshCull.Both ]: /* GL_FRONT_AND_BACK */ 1032
};

export interface MeshOptions extends ComponentOptions {
  geometry: Geometry;
  materials: MaterialMap;
}

export class Mesh extends Component {
  public geometry: Geometry;
  public materials: MaterialMap;

  public cull: MeshCull = MeshCull.Back;
  public depthWrite = true;
  public depthTest = true;

  public constructor( options: MeshOptions ) {
    super( options );

    this.active = false;

    this.geometry = options.geometry;
    this.materials = options.materials;
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
