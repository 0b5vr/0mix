import { BackgroundDefDrawType, buildPlaneBackgroundFrag } from './shaders/buildPlaneBackgroundFrag';
import { Material } from '../../heck/Material';
import { Mesh } from '../../heck/components/Mesh';
import { SceneNode } from '../../heck/components/SceneNode';
import { createRaymarchCameraUniformsLambda } from './createRaymarchCameraUniformsLambda';
import { dummyRenderTarget4 } from '../../globals/dummyRenderTarget';
import { quadGeometry } from '../../globals/quadGeometry';
import { quadVert } from '../../shaders/common/quadVert';

export class PlaneBackground extends SceneNode {
  public deferred: Material;
  public mesh: Mesh;

  public constructor( draw: BackgroundDefDrawType ) {
    super();

    // -- render -----------------------------------------------------------------------------------
    const geometry = quadGeometry;

    const deferred = this.deferred = new Material(
      quadVert,
      buildPlaneBackgroundFrag( draw ),
      {
        initOptions: { geometry, target: dummyRenderTarget4 },
      },
    );
    deferred.addUniform( 'range', '4f', -1.0, -1.0, 1.0, 1.0 );

    const lambdaRaymarchCameraUniforms = createRaymarchCameraUniformsLambda( [ deferred ] );

    const mesh = this.mesh = new Mesh( {
      geometry,
      materials: { deferred },
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
}
