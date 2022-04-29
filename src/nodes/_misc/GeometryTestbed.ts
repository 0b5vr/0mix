import { Geometry } from '../../heck/Geometry';
import { Material } from '../../heck/Material';
import { Mesh } from '../../heck/components/Mesh';
import { SceneNode } from '../../heck/components/SceneNode';
import { deferredUvFrag } from '../../shaders/common/deferredUvFrag';
import { dummyRenderTarget } from '../../globals/dummyRenderTarget';
import { genCylinder } from '../../geometries/genCylinder';
import { objectVert } from '../../shaders/common/objectVert';
import { glVertexArrayBindVertexbuffer } from '../../gl/glVertexArrayBindVertexbuffer';
import { glVertexArrayBindIndexbuffer } from '../../gl/glVertexArrayBindIndexbuffer';
import { GL_ONE } from '../../gl/constants';

export class GeometryTestbed extends SceneNode {
  public constructor() {
    super();

    // -- geometry ---------------------------------------------------------------------------------
    const geomSource = genCylinder();

    const geometry = new Geometry();

    glVertexArrayBindVertexbuffer( geometry.vao, geomSource.position, 0, 3 );
    glVertexArrayBindVertexbuffer( geometry.vao, geomSource.normal, 1, 3 );
    glVertexArrayBindVertexbuffer( geometry.vao, geomSource.uv, 2, 2 );
    glVertexArrayBindIndexbuffer( geometry.vao, geomSource.index );

    geometry.count = geomSource.count;
    geometry.mode = geomSource.mode;
    geometry.indexType = geomSource.indexType;

    // -- materials --------------------------------------------------------------------------------
    const deferred = new Material(
      objectVert,
      deferredUvFrag,
      {
        initOptions: { geometry: geometry, target: dummyRenderTarget },
        blend: [ GL_ONE, GL_ONE ],
      },
    );

    const depth = new Material(
      objectVert,
      deferredUvFrag,
      {
        initOptions: { geometry: geometry, target: dummyRenderTarget },
        blend: [ GL_ONE, GL_ONE ],
      },
    );

    if ( import.meta.env.DEV ) {
      if ( import.meta.hot ) {
        import.meta.hot.accept(
          [
            '../shaders/common/objectVert',
            '../shaders/deferredUvFrag',
          ],
          ( [ { objectVert }, { deferredUvFrag } ] ) => {
            deferred.replaceShader(
              objectVert,
              deferredUvFrag,
            );

            depth.replaceShader(
              objectVert,
              deferredUvFrag,
            );
          },
        );
      }
    }

    const materials = { deferred };

    // -- mesh -------------------------------------------------------------------------------------
    const mesh = new Mesh( {
      geometry,
      materials,
    } );

    if ( import.meta.env.DEV ) {
      mesh.name = 'mesh';
    }

    // -- components -------------------------------------------------------------------------------
    this.children = [
      mesh,
    ];
  }
}
