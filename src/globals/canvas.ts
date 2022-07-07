import 'webgl-memory';

import { GL_BLEND, GL_LEQUAL } from '../gl/constants';

export const canvas = document.createElement( 'canvas' );

export const gl = canvas.getContext( 'webgl2', { antialias: false } )!;
gl.depthFunc( GL_LEQUAL );
gl.enable( GL_BLEND );

gl.getExtension( 'EXT_color_buffer_float' );
gl.getExtension( 'EXT_float_blend' );
gl.getExtension( 'OES_texture_float_linear' );
export const extParallel = gl.getExtension( 'KHR_parallel_shader_compile' );
