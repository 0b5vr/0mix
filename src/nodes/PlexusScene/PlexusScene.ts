import { CameraStack } from '../CameraStack/CameraStack';
import { GL_LINES, GL_POINTS } from '../../gl/constants';
import { Geometry } from '../../heck/Geometry';
import { Material } from '../../heck/Material';
import { Mesh } from '../../heck/components/Mesh';
import { PLEXUS_PARTICLES, PLEXUS_PARTICLES_CBRT } from './constants';
import { SceneNode } from '../../heck/components/SceneNode';
import { cameraStackBTarget } from '../../globals/cameraStackTargets';
import { dummyRenderTarget4 } from '../../globals/dummyRenderTarget';
import { glCreateVertexbuffer } from '../../gl/glCreateVertexbuffer';
import { glVertexArrayBindVertexbuffer } from '../../gl/glVertexArrayBindVertexbuffer';
import { mainCameraStackResources } from '../CameraStack/mainCameraStackResources';
import { plexusFrag } from './shaders/plexusFrag';
import { plexusVert } from './shaders/plexusVert';

export class PlexusScene extends SceneNode {
  public constructor() {
    super();

    // -- geometry ---------------------------------------------------------------------------------
    const geometryPoints = new Geometry();
    geometryPoints.count = PLEXUS_PARTICLES;
    geometryPoints.mode = GL_POINTS;

    const geometryLines = new Geometry();
    geometryLines.mode = GL_LINES;

    const bufferInstancePointsArray = [];
    const bufferInstanceLinesArray = [];
    const bufferInstanceLinesOpArray = [];
    for ( let iz = 0; iz < PLEXUS_PARTICLES_CBRT; iz ++ ) {
      for ( let iy = 0; iy < PLEXUS_PARTICLES_CBRT; iy ++ ) {
        for ( let ix = 0; ix < PLEXUS_PARTICLES_CBRT; ix ++ ) {
          bufferInstancePointsArray.push( ix, iy, iz );

          for ( let icz = -1; icz < 2; icz ++ ) {
            for ( let icy = -1; icy < 2; icy ++ ) {
              for ( let icx = icy > 0 ? 1 : 0; icx < 2; icx ++ ) {
                if ( icx !== 0 || icy !== 0 || icz !== 0 ) {
                  const opx = ( ix + icx + PLEXUS_PARTICLES_CBRT ) % PLEXUS_PARTICLES_CBRT;
                  const opy = ( iy + icy + PLEXUS_PARTICLES_CBRT ) % PLEXUS_PARTICLES_CBRT;
                  const opz = ( iz + icz + PLEXUS_PARTICLES_CBRT ) % PLEXUS_PARTICLES_CBRT;

                  bufferInstanceLinesArray.push(
                    ix, iy, iz,
                    opx, opy, opz,
                  );

                  bufferInstanceLinesOpArray.push(
                    opx, opy, opz,
                    ix, iy, iz,
                  );
                }
              }
            }
          }
        }
      }
    }

    geometryLines.count = bufferInstanceLinesArray.length / 3;

    const bufferInstancePoints
      = glCreateVertexbuffer( new Float32Array( bufferInstancePointsArray ) );
    const bufferInstanceLines
      = glCreateVertexbuffer( new Float32Array( bufferInstanceLinesArray ) );
    const bufferInstanceLinesOp
      = glCreateVertexbuffer( new Float32Array( bufferInstanceLinesOpArray ) );

    glVertexArrayBindVertexbuffer( geometryPoints.vao, bufferInstancePoints, 0, 3 );
    glVertexArrayBindVertexbuffer( geometryLines.vao, bufferInstanceLines, 0, 3 );
    glVertexArrayBindVertexbuffer( geometryLines.vao, bufferInstanceLinesOp, 1, 3 );

    // -- material ---------------------------------------------------------------------------------
    const deferredPoint = new Material(
      plexusVert(),
      plexusFrag,
      {
        initOptions: { geometry: geometryPoints, target: dummyRenderTarget4 },
      }
    );

    const deferred = new Material(
      plexusVert( true ),
      plexusFrag,
      {
        initOptions: { geometry: geometryLines, target: dummyRenderTarget4 },
      }
    );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        [
          './shaders/plexusVert',
          './shaders/plexusFrag',
        ],
        ( [ v, f ] ) => {
          deferredPoint.replaceShader( v?.plexusVert(), f?.plexusFrag );
          deferred.replaceShader( v?.plexusVert( true ), f?.plexusFrag );
        }
      );
    }

    // -- mesh -------------------------------------------------------------------------------------
    const meshPoints = new Mesh( {
      geometry: geometryPoints,
      materials: { deferred: deferredPoint },
    } );

    const meshLines = new Mesh( {
      geometry: geometryLines,
      materials: { deferred },
    } );

    // -- camera -----------------------------------------------------------------------------------
    const camera = new CameraStack( {
      scene: this,
      resources: mainCameraStackResources,
      target: cameraStackBTarget,
      fog: [ 0.0, 1.0, 5.0 ],
      dofParams: [ 2.0, 8.0 ],
    } );

    // -- children ---------------------------------------------------------------------------------
    this.children = [
      meshLines,
      meshPoints,
      camera,
    ];
  }
}
