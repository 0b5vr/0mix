import { Geometry } from '../../heck/Geometry';
import { Material } from '../../heck/Material';
import { Mesh } from '../../heck/components/Mesh';
import { RawVector3 } from '@0b5vr/experimental';
import { SceneNode, SceneNodeOptions } from '../../heck/components/SceneNode';
import { createRaymarchCameraUniformsLambda } from './createRaymarchCameraUniformsLambda';
import { dummyRenderTarget1, dummyRenderTarget4 } from '../../globals/dummyRenderTarget';
import { objectVert } from '../../shaders/common/objectVert';

export interface RaymarcherNodeOptions extends SceneNodeOptions {
  geometry: Geometry;
  vert?: string;
  dimension?: RawVector3;
}

export class RaymarcherNode extends SceneNode {
  public materials: {
    deferred: Material,
    depth: Material,
  };
  public mesh: Mesh;

  public constructor(
    builder: ( tag: 'deferred' | 'depth' ) => string,
    options: RaymarcherNodeOptions,
  ) {
    super( options );

    // -- render -----------------------------------------------------------------------------------
    const geometry = options.geometry;

    const deferred = new Material(
      options.vert ?? objectVert,
      builder( 'deferred' ),
      {
        initOptions: { geometry, target: dummyRenderTarget4 },
      },
    );

    const depth = new Material(
      options.vert ?? objectVert,
      builder( 'depth' ),
      {
        initOptions: { geometry, target: dummyRenderTarget1 },
      },
    );

    const lambdaRaymarchCameraUniforms = createRaymarchCameraUniformsLambda( [
      deferred,
      depth,
    ] );

    const materials = this.materials = { depth, deferred };

    const mesh = this.mesh = new Mesh( {
      geometry,
      materials,
    } );

    if ( import.meta.env.DEV ) {
      mesh.name = 'mesh';
    }

    // -- components -------------------------------------------------------------------------------
    this.children = [
      lambdaRaymarchCameraUniforms,
      mesh,
    ];
  }

  public forEachMaterials( fn: ( material: Material ) => void ): void {
    Object.values( this.materials ).map( ( material ) => fn( material ) );
  }
}
