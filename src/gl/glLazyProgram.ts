import { extParallel, gl } from '../globals/canvas';
import { GL_COMPILE_STATUS, GL_COMPLETION_STATUS_KHR, GL_FRAGMENT_SHADER, GL_LINK_STATUS, GL_SEPARATE_ATTRIBS, GL_VERTEX_SHADER } from './constants';

export interface LazyProgramOptions {
  tfVaryings?: string[],

  /**
   * `gl.SEPARATE_ATTRIBS` by default
   */
  tfBufferMode?: number,
}

export function glLazyProgram(
  vert: string,
  frag: string,
  options: LazyProgramOptions = {},
): Promise<WebGLProgram> {
  const { tfVaryings, tfBufferMode } = options;

  let vertexShader: WebGLShader | undefined;
  let fragmentShader: WebGLShader | undefined;
  let program: WebGLProgram | undefined;

  try {
    // == vert =====================================================================================
    vertexShader = gl.createShader( GL_VERTEX_SHADER )!;

    gl.shaderSource( vertexShader, vert );
    gl.compileShader( vertexShader );

    if ( !gl.getShaderParameter( vertexShader, GL_COMPILE_STATUS ) ) {
      throw new Error( gl.getShaderInfoLog( vertexShader ) ?? undefined );
    }

    // == frag =====================================================================================
    fragmentShader = gl.createShader( GL_FRAGMENT_SHADER )!;

    gl.shaderSource( fragmentShader, frag );
    gl.compileShader( fragmentShader );

    if ( !gl.getShaderParameter( fragmentShader, GL_COMPILE_STATUS ) ) {
      throw new Error( gl.getShaderInfoLog( fragmentShader ) ?? undefined );
    }

    // == program ==================================================================================
    program = gl.createProgram()!;

    gl.attachShader( program, vertexShader );
    gl.attachShader( program, fragmentShader );

    if ( tfVaryings ) {
      gl.transformFeedbackVaryings(
        program,
        tfVaryings,
        tfBufferMode ?? GL_SEPARATE_ATTRIBS,
      );
    }

    gl.linkProgram( program );

    return new Promise( ( resolve, reject ) => {
      const update = () => {
        if (
          !extParallel ||
          gl.getProgramParameter( program!, GL_COMPLETION_STATUS_KHR ) === true
        ) {
          if ( !gl.getProgramParameter( program!, GL_LINK_STATUS ) ) {
            gl.deleteProgram( program! );
            reject( new Error( gl.getProgramInfoLog( program! )! ) );
          } else {
            resolve( program! );
          }

          return;
        }

        setTimeout( update, 10 );
      };
      update();
    } );
  } catch ( e ) {
    gl.deleteProgram( program! );

    return Promise.reject( e );
  } finally {
    gl.deleteShader( fragmentShader! );
    gl.deleteShader( vertexShader! );
  }
}
