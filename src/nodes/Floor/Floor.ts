import { Geometry } from '../../heck/Geometry';
import { HALF_SQRT_TWO } from '../../utils/constants';
import { Lambda } from '../../heck/components/Lambda';
import { Material } from '../../heck/Material';
import { Mesh } from '../../heck/components/Mesh';
import { SceneNode } from '../../heck/components/SceneNode';
import { ShaderRenderTarget } from '../utils/ShaderRenderTarget';
import { TRIANGLE_STRIP_QUAD_3D, TRIANGLE_STRIP_QUAD_NORMAL, TRIANGLE_STRIP_QUAD_UV } from '@0b5vr/experimental';
import { createLightUniformsLambda } from '../utils/createLightUniformsLambda';
import { depthFrag } from '../../shaders/common/depthFrag';
import { dummyRenderTarget1 } from '../../globals/dummyRenderTarget';
import { floorFrag } from './shaders/floorFrag';
import { floorRoughnessFrag } from './shaders/floorRoughnessFrag';
import { objectVert } from '../../shaders/common/objectVert';
import { quadVert } from '../../shaders/common/quadVert';
import { zeroTexture } from '../../globals/zeroTexture';
import { glVertexArrayBindVertexbuffer } from '../../gl/glVertexArrayBindVertexbuffer';
import { glCreateVertexbuffer } from '../../gl/glCreateVertexbuffer';
import { GL_TEXTURE_2D, GL_TRIANGLE_STRIP } from '../../gl/constants';

// -- generate roughness map -------------------------------------------------------------------
export const floorRoughnessTextureTarget = new ShaderRenderTarget(
  2048,
  2048,
  floorRoughnessFrag,
);

if ( import.meta.env.DEV ) {
  floorRoughnessTextureTarget.name = 'Floor/roughness';
}

if ( import.meta.hot ) {
  import.meta.hot.accept(
    './shaders/floorRoughnessFrag',
    ( { floorRoughnessFrag } ) => {
      floorRoughnessTextureTarget.material.replaceShader(
        quadVert,
        floorRoughnessFrag,
      ).then( () => {
        floorRoughnessTextureTarget.quad.drawImmediate();
      } );
    },
  );
}

export class Floor extends SceneNode {
  public forward: Material;

  public constructor() {
    super();

    // -- entity for mesh --------------------------------------------------------------------------
    const meshNode = new SceneNode();
    this.children.push( meshNode );

    meshNode.transform.rotation = [ -HALF_SQRT_TWO, 0.0, 0.0, HALF_SQRT_TWO ];
    meshNode.transform.scale = [ 20.0, 20.0, 20.0 ];

    // -- create buffers ---------------------------------------------------------------------------
    const bufferPos = glCreateVertexbuffer( new Float32Array( TRIANGLE_STRIP_QUAD_3D ) );
    const bufferNor = glCreateVertexbuffer( new Float32Array( TRIANGLE_STRIP_QUAD_NORMAL ) );
    const bufferUv = glCreateVertexbuffer( new Float32Array( TRIANGLE_STRIP_QUAD_UV ) );

    // -- create geometry --------------------------------------------------------------------------
    const geometry = new Geometry();

    glVertexArrayBindVertexbuffer( geometry.vao, bufferPos, 0, 3 );
    glVertexArrayBindVertexbuffer( geometry.vao, bufferNor, 1, 3 );
    glVertexArrayBindVertexbuffer( geometry.vao, bufferUv, 2, 2 );

    geometry.count = 4;
    geometry.mode = GL_TRIANGLE_STRIP;

    // -- create materials -------------------------------------------------------------------------
    const forward = this.forward = new Material(
      objectVert,
      floorFrag,
      {
        initOptions: { geometry, target: dummyRenderTarget1 },
      },
    );
    forward.addUniformTextures( 'samplerRoughness', GL_TEXTURE_2D, floorRoughnessTextureTarget.texture );

    const depth = new Material(
      objectVert,
      depthFrag,
      {
        initOptions: { geometry, target: dummyRenderTarget1 },
      },
    );

    this.children.push( createLightUniformsLambda( [ forward ] ) );

    const materials = { forward, depth };

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        [
          '../../shaders/common/objectVert',
          './shaders/floorFrag',
        ],
        ( [ { objectVert }, { floorFrag } ] ) => {
          forward.replaceShader( objectVert, floorFrag );
        },
      );
    }

    // -- create meshes ----------------------------------------------------------------------------
    const mesh = new Mesh( {
      geometry,
      materials,
    } );
    meshNode.children.push( mesh );

    // -- reset floor ------------------------------------------------------------------------------
    const lambdaResetFloor = new Lambda( {
      onUpdate: () => {
        this.forward.addUniformTextures( 'samplerMirror', GL_TEXTURE_2D, zeroTexture );
      },
    } );

    if ( import.meta.env.DEV ) {
      lambdaResetFloor.name = 'lambdaResetFloor';
    }

    this.children.push( lambdaResetFloor );
  }

  public setMipmapMirrorTexture( texture: WebGLTexture ): void {
    this.forward.addUniformTextures( 'samplerMirror', GL_TEXTURE_2D, texture );
  }
}
