// Déclarations de types pour WebGL
declare global {
  interface WebGLRenderingContext extends WebGLRenderingContextBase, WebGLRenderingContextOverloads, WebGL2RenderingContextBase, WebGL2RenderingContextOverloads {
    // Constantes WebGL 1.0
    readonly DEPTH_BUFFER_BIT: number;
    readonly STENCIL_BUFFER_BIT: number;
    readonly COLOR_BUFFER_BIT: number;
    // ... autres constantes WebGL 1.0
    
    // Méthodes WebGL 1.0
    createBuffer(): WebGLBuffer | null;
    bindBuffer(target: number, buffer: WebGLBuffer | null): void;
    bufferData(target: number, size: number, usage: number): void;
    bufferData(target: number, data: BufferSource | null, usage: number): void;
    bufferSubData(target: number, offset: number, data: BufferSource): void;
    // ... autres méthodes WebGL 1.0
  }

  interface WebGLRenderingContextBase {
    // Méthodes et propriétés de base communes aux deux versions de WebGL
    canvas: HTMLCanvasElement;
    drawingBufferWidth: number;
    drawingBufferHeight: number;
    // ... autres membres de base
  }

  interface WebGLRenderingContextOverloads {
    // Surcharges de méthodes pour différents types de données
    bufferData(target: number, data: BufferSource | null, usage: number): void;
    bufferSubData(target: number, offset: number, data: BufferSource): void;
    // ... autres surcharges
  }

  // Interface pour WebGL 2.0
  interface WebGL2RenderingContext extends WebGLRenderingContext {
    // Constantes et méthodes spécifiques à WebGL 2.0
  }

  interface WebGL2RenderingContextBase {
    // Membres de base de WebGL 2.0
  }

  interface WebGL2RenderingContextOverloads {
    // Surcharges spécifiques à WebGL 2.0
  }

  // Types pour les objets WebGL
  interface WebGLBuffer {}
  interface WebGLFramebuffer {}
  interface WebGLProgram {}
  interface WebGLRenderbuffer {}
  interface WebGLShader {}
  interface WebGLTexture {}
  interface WebGLUniformLocation {}
  interface WebGLShaderPrecisionFormat {
    rangeMin: number;
    rangeMax: number;
    precision: number;
  }

  // Déclaration du contexte WebGL
  interface HTMLCanvasElement extends HTMLElement {
    getContext(contextId: 'webgl', contextAttributes?: WebGLContextAttributes): WebGLRenderingContext | null;
    getContext(contextId: 'experimental-webgl', contextAttributes?: WebGLContextAttributes): WebGLRenderingContext | null;
    getContext(contextId: 'webgl2', contextAttributes?: WebGLContextAttributes): WebGL2RenderingContext | null;
  }

  // Attributs de contexte WebGL
  interface WebGLContextAttributes {
    alpha?: boolean;
    antialias?: boolean;
    depth?: boolean;
    failIfMajorPerformanceCaveat?: boolean;
    powerPreference?: 'default' | 'high-performance' | 'low-power';
    premultipliedAlpha?: boolean;
    preserveDrawingBuffer?: boolean;
    stencil?: boolean;
    desynchronized?: boolean;
    xrCompatible?: boolean;
  }

  // Extensions WebGL
  interface WEBGL_compressed_texture_s3tc {
    readonly COMPRESSED_RGB_S3TC_DXT1_EXT: number;
    readonly COMPRESSED_RGBA_S3TC_DXT1_EXT: number;
    readonly COMPRESSED_RGBA_S3TC_DXT3_EXT: number;
    readonly COMPRESSED_RGBA_S3TC_DXT5_EXT: number;
  }

  interface EXT_texture_filter_anisotropic {
    readonly TEXTURE_MAX_ANISOTROPY_EXT: number;
    readonly MAX_TEXTURE_MAX_ANISOTROPY_EXT: number;
  }

  // Déclaration des extensions dans le contexte WebGL
  interface WebGLRenderingContext {
    getExtension(extensionName: 'WEBGL_compressed_texture_s3tc'): WEBGL_compressed_texture_s3tc | null;
    getExtension(extensionName: 'EXT_texture_filter_anisotropic'): EXT_texture_filter_anisotropic | null;
    // ... autres extensions
  }

  // Types pour les shaders
  interface WebGLShaderPrecisionFormat {
    rangeMin: number;
    rangeMax: number;
    precision: number;
  }

  // Types pour les programmes et les shaders
  interface WebGLProgram {}
  interface WebGLShader {}
  interface WebGLUniformLocation {}
  interface WebGLActiveInfo {
    size: number;
    type: number;
    name: string;
  }

  // Types pour les buffers
  interface WebGLBuffer {}
  interface WebGLFramebuffer {}
  interface WebGLRenderbuffer {}
  interface WebGLTexture {}
  interface WebGLVertexArrayObjectOES {}

  // Types pour les requêtes
  interface WebGLQuery {}
  interface WebGLSampler {}
  interface WebGLSync {}
  interface WebGLTransformFeedback {}
  interface WebGLVertexArrayObject {}
}

export {};
