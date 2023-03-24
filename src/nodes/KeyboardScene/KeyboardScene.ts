import { CameraStack } from '../CameraStack/CameraStack';
import { GL_TEXTURE_2D } from '../../gl/constants';
import { HALF_SQRT_TWO } from '../../utils/constants';
import { Lambda } from '../../heck/components/Lambda';
import { Material } from '../../heck/Material';
import { Mesh } from '../../heck/components/Mesh';
import { PointLightNode } from '../Lights/PointLightNode';
import { RaymarcherNode } from '../utils/RaymarcherNode';
import { SceneNode } from '../../heck/components/SceneNode';
import { arraySerial, quatRotationY, vec3ApplyQuaternion } from '@0b5vr/experimental';
import { cameraStackATarget } from '../../globals/cameraStackTargets';
import { deskFrag } from './shaders/deskFrag';
import { dummyRenderTarget4 } from '../../globals/dummyRenderTarget';
import { genCube } from '../../geometries/genCube';
import { glCreateVertexbuffer } from '../../gl/glCreateVertexbuffer';
import { glVertexArrayBindVertexbuffer } from '../../gl/glVertexArrayBindVertexbuffer';
import { keyboardBaseFrag } from './shaders/keyboardBaseFrag';
import { keycapFrag } from './shaders/keycapFrag';
import { keycapVert } from './shaders/keycapVert';
import { mainCameraStackResources } from '../CameraStack/mainCameraStackResources';
import { moonTexture } from '../../globals/moonTexGen';
import { objectVert } from '../../shaders/common/objectVert';
import { quad3DGeometry } from '../../globals/quad3DGeometry';
import { swapShadowMap1, swapShadowMap2 } from '../../globals/swapShadowMap';

export class KeyboardScene extends SceneNode {
  public constructor() {
    super();

    const scene = this;

    // -- lights -----------------------------------------------------------------------------------
    const light1 = new PointLightNode( {
      scene,
      swapShadowMap: swapShadowMap1,
      shadowMapFov: 30.0,
    } );
    light1.transform.lookAt( [ 4.0, 8.0, 8.0 ] );
    light1.color = [ 1000.0, 1000.0, 1000.0 ];

    const light2 = new PointLightNode( {
      scene,
      swapShadowMap: swapShadowMap2,
      shadowMapFov: 30.0,
    } );
    light2.transform.lookAt( [ 0.0, 8.0, -4.0 ] );
    light2.color = [ 100.0, 100.0, 100.0 ];

    // -- keycaps ----------------------------------------------------------------------------------
    const geometryKeycaps = genCube();

    const arrayInstance = [
      0, 0, 1, 0, // Esc
      ...arraySerial( 4 ).flatMap( ( i ) => [ 2.0 + i, 0, 1, 0 ] ), // F1 - F4
      ...arraySerial( 4 ).flatMap( ( i ) => [ 6.5 + i, 0, 1, 0 ] ), // F5 - F8
      ...arraySerial( 4 ).flatMap( ( i ) => [ 11.0 + i, 0, 1, 0 ] ), // F9 - F12
      ...arraySerial( 13 ).flatMap( ( i ) => [ i, 1.5, 1, 0 ] ), // ` to =
      13, 1.5, 2, 0, // BS
      0, 2.5, 1.5, 0, // Tab
      ...arraySerial( 12 ).flatMap( ( i ) => [ 1.5 + i, 2.5, 1, 0 ] ), // q to ]
      13.5, 2.5, 1.5, 0, // \
      0, 3.5, 1.75, 0, // LCaps
      ...arraySerial( 11 ).flatMap( ( i ) => [ 1.75 + i, 3.5, 1, 0 ] ), // a to '
      12.75, 3.5, 2.25, 0, // Enter
      0, 4.5, 2.25, 0, // LShift
      ...arraySerial( 10 ).flatMap( ( i ) => [ 2.25 + i, 4.5, 1, 0 ] ), // z to /
      12.25, 4.5, 2.75, 0, // RShift
      ...arraySerial( 3 ).flatMap( ( i ) => [ 1.25 * i, 5.5, 1.25, 0 ] ), // LCtrl to LAlt
      3.75, 5.5, 6.25, 1, // Space
      ...arraySerial( 4 ).flatMap( ( i ) => [ 10 + 1.25 * i, 5.5, 1.25, 0 ] ), // RAlt to RCtrl
      ...arraySerial( 3 ).flatMap( ( i ) => [ 15.5 + i, 0, 1, 0 ] ), // weird trio
      ...arraySerial( 3 ).flatMap( ( i ) => [ 15.5 + i, 1.5, 1, 0 ] ), // Ins, Home, PgUp
      ...arraySerial( 3 ).flatMap( ( i ) => [ 15.5 + i, 2.5, 1, 0 ] ), // Del, End, PgDn
      16.5, 4.5, 1, 0, // ↑
      ...arraySerial( 3 ).flatMap( ( i ) => [ 15.5 + i, 5.5, 1, 0 ] ), // ←↓→
    ];

    const bufferInstance = glCreateVertexbuffer( new Float32Array( arrayInstance ) );
    glVertexArrayBindVertexbuffer( geometryKeycaps.vao, bufferInstance, 2, 4, 1 );

    geometryKeycaps.primcount = 87;

    const keycap = new RaymarcherNode(
      keycapFrag,
      {
        geometry: geometryKeycaps,
        vert: keycapVert,
      }
    );
    keycap.transform.position = [ -18.5, 0.0, -6.5 ];

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        [ './shaders/keycapVert', './shaders/keycapFrag' ],
        ( [ v, f ] ) => {
          const { deferred, depth } = keycap.materials;

          deferred.replaceShader( v?.keycapVert, f?.keycapFrag( 'deferred' ) );
          depth.replaceShader( v?.keycapVert, f?.keycapFrag( 'depth' ) );
        },
      );
    }

    // -- keyboard base ----------------------------------------------------------------------------
    const geometryKeyboardBase = genCube( { dimension: [ 20.0, 2.0, 8.0 ] } );

    const keyboardBase = new RaymarcherNode(
      keyboardBaseFrag,
      {
        geometry: geometryKeyboardBase,
      },
    );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        './shaders/keyboardBaseFrag',
        ( { keyboardBaseFrag } ) => {
          const { deferred, depth } = keyboardBase.materials;

          deferred.replaceShader( undefined, keyboardBaseFrag( 'deferred' ) );
          depth.replaceShader( undefined, keyboardBaseFrag( 'depth' ) );
        },
      );
    }

    // -- keyboard ---------------------------------------------------------------------------------
    const keyboard = new SceneNode( {
      children: [
        keycap,
        keyboardBase,
      ],
    } );
    keyboard.transform.scale = [ 0.1, 0.1, 0.1 ];

    // -- desk -------------------------------------------------------------------------------------
    const deskDeferred = new Material(
      objectVert,
      deskFrag,
      {
        initOptions: { geometry: quad3DGeometry, target: dummyRenderTarget4 },
      },
    );

    deskDeferred.addUniformTextures( 'sampler0', GL_TEXTURE_2D, moonTexture );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        './shaders/deskFrag',
        ( { deskFrag } ) => {
          deskDeferred.replaceShader( undefined, deskFrag );
        },
      );
    }

    const deskNode = new SceneNode();
    deskNode.transform.rotation = [ -HALF_SQRT_TWO, 0.0, 0.0, HALF_SQRT_TWO ];
    deskNode.transform.position = [ 0.0, -0.2, 0.0 ];
    deskNode.transform.scale = [ 10.0, 10.0, 10.0 ];

    const desk = new Mesh( {
      geometry: quad3DGeometry,
      materials: { deferred: deskDeferred },
    } );
    deskNode.children.push( desk );

    if ( import.meta.env.DEV ) {
      desk.name = 'desk';
    }

    // -- camera -----------------------------------------------------------------------------------
    const camera = new CameraStack( {
      scene,
      resources: mainCameraStackResources,
      target: cameraStackATarget,
      useAO: true,
      near: 0.01,
      dofParams: [ 3.2, 16.0 ],
    } );

    const lambdaSpeen = new Lambda( {
      onUpdate: ( { time } ) => {
        camera.transform.lookAt(
          vec3ApplyQuaternion( [ 0.0, 1.5, 3.0 ], quatRotationY( time ) ),
          [ 0.0, 0.0, 0.0 ],
          -0.2,
        );
      },
    } );

    if ( import.meta.env.DEV ) {
      lambdaSpeen.name = 'speen';
    }

    // -- children ---------------------------------------------------------------------------------
    this.children = [
      light1,
      light2,
      lambdaSpeen,
      keyboard,
      deskNode,
      camera,
    ];
  }
}
