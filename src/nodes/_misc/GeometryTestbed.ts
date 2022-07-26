import { GL_ONE } from '../../gl/constants';
import { Material } from '../../heck/Material';
import { Mesh } from '../../heck/components/Mesh';
import { SceneNode } from '../../heck/components/SceneNode';
import { deferredUvFrag } from '../../shaders/common/deferredUvFrag';
import { dummyRenderTarget1 } from '../../globals/dummyRenderTarget';
import { genCylinder } from '../../geometries/genCylinder';
import { objectVert } from '../../shaders/common/objectVert';

export class GeometryTestbed extends SceneNode {
  public constructor() {
    super();

    // -- geometry ---------------------------------------------------------------------------------
    const geometry = genCylinder();

    // -- materials --------------------------------------------------------------------------------
    const deferred = new Material(
      objectVert,
      deferredUvFrag,
      {
        initOptions: { geometry: geometry, target: dummyRenderTarget1 },
        blend: [ GL_ONE, GL_ONE ],
      },
    );

    const depth = new Material(
      objectVert,
      deferredUvFrag,
      {
        initOptions: { geometry: geometry, target: dummyRenderTarget1 },
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
