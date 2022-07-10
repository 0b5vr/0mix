import { GL_LINES, GL_NEAREST, GL_ONE, GL_POINTS, GL_TEXTURE_2D } from '../../gl/constants';
import { glCreateVertexbuffer } from '../../gl/glCreateVertexbuffer';
import { glTextureFilter } from '../../gl/glTextureFilter';
import { glVertexArrayBindVertexbuffer } from '../../gl/glVertexArrayBindVertexbuffer';
import { dummyRenderTarget1 } from '../../globals/dummyRenderTarget';
import { BufferTextureRenderTarget } from '../../heck/BufferTextureRenderTarget';
import { Blit } from '../../heck/components/Blit';
import { Quad } from '../../heck/components/Quad';
import { SceneNode, SceneNodeOptions } from '../../heck/components/SceneNode';
import { Geometry } from '../../heck/Geometry';
import { Material } from '../../heck/Material';
import { RenderTarget } from '../../heck/RenderTarget';
import { histogramGatherFrag } from './shaders/histogramGatherFrag';
import { histogramGatherVert } from './shaders/histogramGatherVert';
import { histogramPlotVert } from './shaders/histogramPlotVert';

export interface HistogramScatterOptions extends SceneNodeOptions {
  input: BufferTextureRenderTarget;
  target: RenderTarget;
}

export class HistogramScatter extends SceneNode {
  public constructor( options: HistogramScatterOptions ) {
    super( options );

    const { input, target } = options;

    this.visible = false;

    const width = 256;
    const height = 256;

    // -- target gather ----------------------------------------------------------------------------
    const targetGather = new BufferTextureRenderTarget( 256, 1 );

    glTextureFilter( targetGather.texture, GL_NEAREST );

    if ( import.meta.env.DEV ) {
      targetGather.name = 'HistogramScatter/targetGather';
    }

    // -- geometry gather --------------------------------------------------------------------------
    const geometryGather = new Geometry();

    const arrayV = new Float32Array( height ).map( ( _, i ) => ( i + 0.5 ) / height );
    const arrayU = new Float32Array( 3 * width ).map( ( _, i ) => ( ( i % width ) + 0.5 ) / width );
    const arrayC = new Float32Array( 3 ).map( ( _, i ) => i );

    const bufferV = glCreateVertexbuffer( arrayV );
    const bufferU = glCreateVertexbuffer( arrayU );
    const bufferC = glCreateVertexbuffer( arrayC );

    glVertexArrayBindVertexbuffer( geometryGather.vao, bufferV, 0, 1 );
    glVertexArrayBindVertexbuffer( geometryGather.vao, bufferU, 1, 1, 1 );
    glVertexArrayBindVertexbuffer( geometryGather.vao, bufferC, 2, 1, height );

    geometryGather.count = width;
    geometryGather.primcount = height * 3;
    geometryGather.mode = GL_POINTS;

    // -- material gather --------------------------------------------------------------------------
    const materialGather = new Material(
      histogramGatherVert,
      histogramGatherFrag,
      {
        initOptions: { geometry: geometryGather, target: dummyRenderTarget1 },
        blend: [ GL_ONE, GL_ONE ],
      },
    );

    materialGather.addUniformTextures( 'sampler0', GL_TEXTURE_2D, input.texture );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        [
          './shaders/histogramGatherVert',
          './shaders/histogramGatherFrag',
        ],
        ( [ v, f ] ) => {
          materialGather.replaceShader( v?.histogramGatherVert, f?.histogramGatherFrag );
        },
      );
    }

    // -- quad gather ------------------------------------------------------------------------------
    const quadGather = new Quad( {
      geometry: geometryGather,
      material: materialGather,
      target: targetGather,
      depthTest: false,
      depthWrite: false,
      clear: [ 0.0, 0.0, 0.0, 0.0 ],
    } );

    if ( import.meta.env.DEV ) {
      quadGather.name = 'quadGather';
    }

    // -- target plot ------------------------------------------------------------------------------
    const targetPlot = new BufferTextureRenderTarget( 256, 128 );

    if ( import.meta.env.DEV ) {
      targetPlot.name = 'HistogramScatter/targetPlot';
    }

    // -- geometry plot ----------------------------------------------------------------------------
    const geometryPlot = new Geometry();

    const arrayY = new Float32Array( 2 ).map( ( _, i ) => i );

    const bufferY = glCreateVertexbuffer( arrayY );

    glVertexArrayBindVertexbuffer( geometryPlot.vao, bufferY, 0, 1 );
    glVertexArrayBindVertexbuffer( geometryPlot.vao, bufferU, 1, 1, 1 );
    glVertexArrayBindVertexbuffer( geometryPlot.vao, bufferC, 2, 1, 256 );

    geometryPlot.count = 2;
    geometryPlot.primcount = 768;
    geometryPlot.mode = GL_LINES;

    // -- material plot ----------------------------------------------------------------------------
    const materialPlot = new Material(
      histogramPlotVert,
      histogramGatherFrag,
      {
        initOptions: { geometry: geometryPlot, target: dummyRenderTarget1 },
        blend: [ GL_ONE, GL_ONE ],
      },
    );

    materialPlot.addUniformTextures( 'sampler0', GL_TEXTURE_2D, targetGather.texture );

    if ( import.meta.hot ) {
      import.meta.hot.accept(
        [
          './shaders/histogramPlotVert',
          './shaders/histogramGatherFrag',
        ],
        ( [ v, f ] ) => {
          materialPlot.replaceShader( v?.histogramPlotVert, f?.histogramGatherFrag );
        },
      );
    }

    // -- quad plot --------------------------------------------------------------------------------
    const quadPlot = new Quad( {
      geometry: geometryPlot,
      material: materialPlot,
      target: targetPlot,
      depthTest: false,
      depthWrite: false,
      clear: [ 0.0, 0.0, 0.0, 0.0 ],
    } );

    if ( import.meta.env.DEV ) {
      quadPlot.name = 'quadPlot';
    }

    // -- blit -------------------------------------------------------------------------------------
    const blit = new Blit( {
      src: targetPlot,
      dst: target,
      dstRect: [ 0, 0, 256, 128 ],
    } );

    // -- children ---------------------------------------------------------------------------------
    this.children = [
      quadGather,
      quadPlot,
      blit,
    ];
  }
}
