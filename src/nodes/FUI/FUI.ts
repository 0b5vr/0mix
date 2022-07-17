import { CharCanvasTexture } from './CharCanvasTexture';
import { GL_NONE, GL_ONE, GL_TEXTURE_2D, GL_TRIANGLE_STRIP } from '../../gl/constants';
import { Geometry } from '../../heck/Geometry';
import { Material } from '../../heck/Material';
import { Mesh } from '../../heck/components/Mesh';
import { SceneNode, SceneNodeOptions } from '../../heck/components/SceneNode';
import { TRIANGLE_STRIP_QUAD_3D, TRIANGLE_STRIP_QUAD_NORMAL, TRIANGLE_STRIP_QUAD_UV } from '@0b5vr/experimental';
import { auto } from '../../globals/automaton';
import { dummyRenderTarget1 } from '../../globals/dummyRenderTarget';
import { fuiFrag } from './shaders/fuiFrag';
import { getYugoppText } from '../../utils/getYugoppText';
import { glCreateVertexbuffer } from '../../gl/glCreateVertexbuffer';
import { glVertexArrayBindVertexbuffer } from '../../gl/glVertexArrayBindVertexbuffer';
import { objectVert } from '../../shaders/common/objectVert';
import { randomTexture } from '../../globals/randomTexture';

export const charCanvasTexture = new CharCanvasTexture( 2048, 2048 );

const texts = [
  [ 'cube', 'an important, single step' ],
  [ 'sss', 'subsurface scatter-brain' ],
  [ 'menger_sponge', 'fractal dimension = 2.7268...' ],
  [ 'asphalt', 'high-octane flavored' ],
  [ '0b5vr', 'live coding and tax saving vtuber' ],
  [ 'sp4ghet', 'angura girl with a torus-knot' ],
  [ 'fluid', 'the incomprehensible flow' ],
  [ 'xorshit', 'shut up my brain' ],
  [ 'webpack', 'still suffering in the minifier hell' ],
  [ 'infodesk', 'need some help?' ],
  [ 'warning', 'gl_invalid_operation' ],
  [ 'parking_space', 'beware of floating cubes' ],
  [ 'octree', 'does not look like a tree at all' ],
  [ 'advantage_cube', 'press triangle to explode' ],
  [ 'crate', 'woah' ],
  [ 'cardboard_box', 'trace 1,000,000 rays to get free global illumination' ],
  [ 'particles', '65,536 cube pickles' ],
  [ 'trails', 'spaghetti made of spaghetti code' ],
  [ 'infinity_grid', 'the suffer never ends' ],
  [ 'sierpinski', 'wanna lay here?' ],
  [ 'instancer', 'speen' ],
  [ 'lissajous', 'oscillates like my mental condition' ],
  [ 'root', 'it\'s a real cube root!' ],
  [ 'ifs', 'the classic' ],
  [ 'iridescent', 'it never quits changing its own color' ],
  [ 'dice', 'life is a series of gambling' ],
  [ 'esc', 'press esc to end the experience' ],
  [ 'traveler', 'it still travels through the raymarched labyrinth' ],
  [ 'crt', '0b5vr <3 you' ],
  [ 'uv_gradient', 'gl_fragcolor = vec4( uv, 0.5, 1.0 );' ],
  [ 'sky', 'we cannot reach the sky' ],
  [ 'bump_block', 'keep clear' ],
];

auto( 'FUI/yugopp', ( { progress } ) => {
  const stuffIndex = auto( 'stuff' );
  const t = texts[ stuffIndex ];

  if ( t != null ) {
    const indexText = ( '0' + ( stuffIndex + 1 ) ).slice( -2 );

    charCanvasTexture.clear();
    charCanvasTexture.drawChars( 24, 68, 11, getYugoppText( indexText, progress * 4.0 ) );
    charCanvasTexture.drawChars( 320, 120, 7, getYugoppText( t[ 0 ], progress * 2.0 - 0.25 ) );
    charCanvasTexture.drawChars( 316, 60, 2.5, getYugoppText( t[ 1 ], progress * 2.0 - 0.5 ) );
    charCanvasTexture.updateTexture();
  }
} );

export class FUI extends SceneNode {
  public constructor( options?: SceneNodeOptions ) {
    super( options );
    this.transform.position = [ 0.0, 3.0, 3.3 ];
    this.transform.scale = [ 3.0, 3.0, 1.0 ];

    // -- geometry ---------------------------------------------------------------------------------
    const bufferPos = glCreateVertexbuffer( new Float32Array( TRIANGLE_STRIP_QUAD_3D ) );
    const bufferNormal = glCreateVertexbuffer( new Float32Array( TRIANGLE_STRIP_QUAD_NORMAL ) );
    const bufferUv = glCreateVertexbuffer( new Float32Array( TRIANGLE_STRIP_QUAD_UV ) );

    const geometry = new Geometry();

    glVertexArrayBindVertexbuffer( geometry.vao, bufferPos, 0, 3 );
    glVertexArrayBindVertexbuffer( geometry.vao, bufferNormal, 1, 3 );
    glVertexArrayBindVertexbuffer( geometry.vao, bufferUv, 2, 2 );

    geometry.count = 4;
    geometry.mode = GL_TRIANGLE_STRIP;

    // -- material ---------------------------------------------------------------------------------
    const forward = new Material(
      objectVert,
      fuiFrag( 'forward' ),
      {
        initOptions: { geometry, target: dummyRenderTarget1 },
        blend: [ GL_ONE, GL_ONE ],
      },
    );
    forward.addUniform( 'color', '4f', 1.0, 1.0, 1.0, 1.0 );
    forward.addUniformTextures( 'samplerRandom', GL_TEXTURE_2D, randomTexture.texture );
    forward.addUniformTextures( 'samplerChar', GL_TEXTURE_2D, charCanvasTexture.texture );

    const depth = new Material(
      objectVert,
      fuiFrag( 'depth' ),
      {
        initOptions: { geometry, target: dummyRenderTarget1 },
      },
    );
    depth.addUniform( 'color', '4f', 1.0, 1.0, 1.0, 1.0 );
    depth.addUniformTextures( 'samplerRandom', GL_TEXTURE_2D, randomTexture.texture );
    depth.addUniformTextures( 'samplerChar', GL_TEXTURE_2D, charCanvasTexture.texture );

    auto( 'fui/opacity', ( { value } ) => {
      forward.addUniform( 'opacity', '1f', value );
      depth.addUniform( 'opacity', '1f', value );
    } );

    const materials = { forward, cubemap: forward, depth };

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        [
          '../../shaders/common/objectVert',
          './shaders/fuiFrag',
        ],
        ( [ { objectVert }, { fuiFrag } ] ) => {
          forward.replaceShader( objectVert, fuiFrag( 'forward' ) );
          depth.replaceShader( objectVert, fuiFrag( 'depth' ) );
        },
      );
    }

    // -- mesh -------------------------------------------------------------------------------------
    const mesh = new Mesh( { geometry, materials } );
    mesh.cull = GL_NONE;

    if ( import.meta.env.DEV ) {
      mesh.name = 'mesh';
    }

    // -- components -------------------------------------------------------------------------------
    this.children = [
      mesh,
    ];
  }
}
