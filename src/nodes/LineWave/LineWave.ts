import { GL_LINE_STRIP } from '../../gl/constants';
import { glCreateVertexbuffer } from '../../gl/glCreateVertexbuffer';
import { glVertexArrayBindVertexbuffer } from '../../gl/glVertexArrayBindVertexbuffer';
import { dummyRenderTarget1 } from '../../globals/dummyRenderTarget';
import { Mesh } from '../../heck/components/Mesh';
import { SceneNode } from '../../heck/components/SceneNode';
import { Geometry } from '../../heck/Geometry';
import { Material } from '../../heck/Material';
import { colorFrag } from '../../shaders/common/colorFrag';
import { lineWaveVert } from './shaders/lineWaveVert';

export class LineWave extends SceneNode {
  public cameraProxy: SceneNode;

  public constructor() {
    super();

    // -- geometry ---------------------------------------------------------------------------------
    const geometry = new Geometry();
    geometry.primcount = 512;
    geometry.count = 512;
    geometry.mode = GL_LINE_STRIP;

    const bufferInstanceArray = new Float32Array( 513 ).map( ( _, i ) => i / 512 * 4.0 - 2.0 );
    const bufferInstanceA = glCreateVertexbuffer( bufferInstanceArray ); // TODO
    const bufferInstance = glCreateVertexbuffer( bufferInstanceArray );

    glVertexArrayBindVertexbuffer( geometry.vao, bufferInstanceA, 0, 1 );
    glVertexArrayBindVertexbuffer( geometry.vao, bufferInstance, 1, 1, 1 );

    // -- material ---------------------------------------------------------------------------------
    const forward = new Material(
      lineWaveVert,
      colorFrag,
      {
        initOptions: { geometry, target: dummyRenderTarget1 },
      },
    );
    forward.addUniform( 'color', '4f', 0.3, 0.3, 0.3, 1.0 );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        './shaders/lineWaveVert',
        ( { lineWaveVert } ) => {
          forward.replaceShader( lineWaveVert, colorFrag );
        }
      )
    }

    // -- mesh -------------------------------------------------------------------------------------
    const mesh = new Mesh( {
      geometry,
      materials: { forward },
    } );

    if ( import.meta.env.DEV ) {
      mesh.name = 'mesh';
    }

    // -- camera proxy -----------------------------------------------------------------------------
    this.cameraProxy = new SceneNode();
    this.cameraProxy.transform.lookAt(
      [ 0.0, -0.8, 0.8 ],
      [ 0.0, 0.0, 0.0 ],
      [ 0.0, 1.0, 0.0 ],
      0.0,
    );

    // -- children ---------------------------------------------------------------------------------
    this.children = [
      mesh,
      this.cameraProxy,
    ];
  }
}
