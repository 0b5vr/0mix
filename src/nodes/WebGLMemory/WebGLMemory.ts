import { gl } from '../../globals/canvas';
import { promiseGui } from '../../globals/gui';
import { Lambda } from '../../heck/components/Lambda';
import { SceneNode } from '../../heck/components/SceneNode';

export class WebGLMemory extends SceneNode {
  public constructor() {
    super();

    const webglMemory = gl.getExtension( 'GMAN_webgl_memory' );

    promiseGui.then( ( gui ) => {
      const lambdaUpdateWebGLMemory = new Lambda( {
        onUpdate: () => {
          if ( gui.value( 'webgl-memory/active', false ) ) {
            if ( webglMemory == null ) {
              gui.monitor(
                'webgl-memory/unavailable',
                'make sure you import webgl-memory',
              );
            } else {
              const info = webglMemory.getMemoryInfo();

              gui.monitor(
                'webgl-memory/buffer',
                `${ info.resources.buffer } - ${ ( info.memory.buffer * 1E-6 ).toFixed( 1 ) } MB`,
              );
              gui.monitor(
                'webgl-memory/texture',
                `${ info.resources.texture } - ${ ( info.memory.texture * 1E-6 ).toFixed( 1 ) } MB`,
              );
              gui.monitor(
                'webgl-memory/renderbuffer',
                `${ info.resources.renderbuffer } - ${ ( info.memory.renderbuffer * 1E-6 ).toFixed( 1 ) } MB`,
              );
              gui.monitor(
                'webgl-memory/program',
                `${ info.resources.program }`,
              );
              gui.monitor(
                'webgl-memory/shader',
                `${ info.resources.shader }`,
              );
              gui.monitor(
                'webgl-memory/drawingbuffer',
                `${ ( info.memory.drawingbuffer * 1E-6 ).toFixed( 1 ) } MB`,
              );
              gui.monitor(
                'webgl-memory/total',
                `${ ( info.memory.total * 1E-6 ).toFixed( 1 ) } MB`,
              );
            }
          }
        },
      } );

      if ( import.meta.env.DEV ) {
        lambdaUpdateWebGLMemory.name = 'lambdaUpdateWebGLMemory';
      }

      this.children.push( lambdaUpdateWebGLMemory );
    } );
  }
}
