declare module 'webgl-memory' {
  // nothing here
}

declare interface GMAN_webgl_memory {
  getMemoryInfo(): {
    memory: {
      buffer: number;
      texture: number;
      renderbuffer: number;
      drawingbuffer: number;
      total: number;
    };
    resources: {
      buffer: number;
      renderbuffer: number;
      program: number;
      query: number;
      sampler: number;
      shader: number;
      sync: number;
      texture: number;
      transformFeedback: number;
      vertexArray: number;
    };
  };
}

declare interface WebGLRenderingContextBase {
  getExtension( extensionName: 'GMAN_webgl_memory' ): GMAN_webgl_memory | null;
}
