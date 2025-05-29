// Déclarations de types pour l'API Web Audio
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }

  // Types pour l'API Web Audio
  interface AudioContext extends EventTarget {
    readonly sampleRate: number;
    readonly currentTime: number;
    readonly state: AudioContextState;
    readonly baseLatency: number;
    readonly outputLatency: number;
    onstatechange: ((this: AudioContext, ev: Event) => any) | null;
    destination: AudioDestinationNode;
    
    createAnalyser(): AnalyserNode;
    createBufferSource(): AudioBufferSourceNode;
    createMediaStreamSource(stream: MediaStream): MediaStreamAudioSourceNode;
    createMediaStreamDestination(): MediaStreamAudioDestinationNode;
    createGain(): GainNode;
    close(): Promise<void>;
    resume(): Promise<void>;
    suspend(): Promise<void>;
    getOutputTimestamp(): AudioTimestamp;
    decodeAudioData(
      audioData: ArrayBuffer,
      successCallback?: (decodedData: AudioBuffer) => void,
      errorCallback?: (error: DOMException) => void
    ): Promise<AudioBuffer>;
  }

  interface AudioContextOptions {
    latencyHint?: AudioContextLatencyCategory | number;
    sampleRate?: number;
  }

  type AudioContextLatencyCategory = 'balanced' | 'interactive' | 'playback';
  type AudioContextState = 'suspended' | 'running' | 'closed';

  interface AudioTimestamp {
    contextTime: number;
    performanceTime: number;
  }

  interface AudioNode extends EventTarget {
    connect(destinationNode: AudioNode, output?: number, input?: number): AudioNode;
    connect(destinationParam: AudioParam, output?: number): void;
    disconnect(): void;
    disconnect(output: number): void;
    disconnect(destinationNode: AudioNode): void;
    disconnect(destinationNode: AudioNode, output: number): void;
    disconnect(destinationNode: AudioNode, output: number, input: number): void;
    disconnect(destinationParam: AudioParam): void;
    disconnect(destinationParam: AudioParam, output: number): void;
    context: AudioContext;
    numberOfInputs: number;
    numberOfOutputs: number;
    channelCount: number;
    channelCountMode: ChannelCountMode;
    channelInterpretation: ChannelInterpretation;
  }

  type ChannelCountMode = 'max' | 'clamped-max' | 'explicit';
  type ChannelInterpretation = 'speakers' | 'discrete';

  interface AudioBufferSourceNode extends AudioNode {
    buffer: AudioBuffer | null;
    detune: AudioParam;
    loop: boolean;
    loopEnd: number;
    loopStart: number;
    onended: ((this: AudioBufferSourceNode, ev: Event) => any) | null;
    playbackRate: AudioParam;
    start(when?: number, offset?: number, duration?: number): void;
    stop(when?: number): void;
  }

  interface AudioBuffer {
    readonly duration: number;
    readonly length: number;
    readonly numberOfChannels: number;
    readonly sampleRate: number;
    copyFromChannel(destination: Float32Array, channelNumber: number, startInChannel?: number): void;
    copyToChannel(source: Float32Array, channelNumber: number, startInChannel?: number): void;
    getChannelData(channel: number): Float32Array;
  }

  interface AudioParam extends EventTarget {
    defaultValue: number;
    readonly maxValue: number;
    readonly minValue: number;
    value: number;
    cancelScheduledValues(cancelTime: number): AudioParam;
    exponentialRampToValueAtTime(value: number, endTime: number): AudioParam;
    linearRampToValueAtTime(value: number, endTime: number): AudioParam;
    setTargetAtTime(target: number, startTime: number, timeConstant: number): AudioParam;
    setValueAtTime(value: number, startTime: number): AudioParam;
    setValueCurveAtTime(values: Float32Array | number[], startTime: number, duration: number): AudioParam;
  }

  interface AnalyserNode extends AudioNode {
    fftSize: number;
    frequencyBinCount: number;
    readonly maxDecibels: number;
    readonly minDecibels: number;
    smoothingTimeConstant: number;
    getByteFrequencyData(array: Uint8Array): void;
    getByteTimeDomainData(array: Uint8Array): void;
    getFloatFrequencyData(array: Float32Array): void;
    getFloatTimeDomainData(array: Float32Array): void;
  }

  interface GainNode extends AudioNode {
    readonly gain: AudioParam;
  }

  interface MediaStreamAudioSourceNode extends AudioNode {
    readonly mediaStream: MediaStream;
  }

  interface MediaStreamAudioDestinationNode extends AudioNode {
    readonly stream: MediaStream;
  }

  interface AudioDestinationNode extends AudioNode {
    readonly maxChannelCount: number;
  }

  // Déclaration du constructeur AudioContext
  const AudioContext: {
    prototype: AudioContext;
    new(contextOptions?: AudioContextOptions): AudioContext;
  };

  // Déclaration pour la création d'éléments audio
  interface HTMLAudioElement extends HTMLMediaElement {
    // Propriétés et méthodes spécifiques à l'élément audio
  }

  interface HTMLMediaElement extends HTMLElement {
    // Propriétés et méthodes communes aux éléments média
    src: string;
    currentTime: number;
    duration: number;
    paused: boolean;
    play(): Promise<void>;
    pause(): void;
    load(): void;
    canPlayType(type: string): string;
    addEventListener<K extends keyof HTMLMediaElementEventMap>(
      type: K,
      listener: (this: HTMLMediaElement, ev: HTMLMediaElementEventMap[K]) => any,
      options?: boolean | AddEventListenerOptions
    ): void;
    removeEventListener<K extends keyof HTMLMediaElementEventMap>(
      type: K,
      listener: (this: HTMLMediaElement, ev: HTMLMediaElementEventMap[K]) => any,
      options?: boolean | EventListenerOptions
    ): void;
  }

  interface HTMLMediaElementEventMap extends HTMLElementEventMap {
    'canplay': Event;
    'canplaythrough': Event;
    'durationchange': Event;
    'ended': Event;
    'loadeddata': Event;
    'loadedmetadata': Event;
    'pause': Event;
    'play': Event;
    'playing': Event;
    'ratechange': Event;
    'seeked': Event;
    'seeking': Event;
    'stalled': Event;
    'suspend': Event;
    'timeupdate': Event;
    'volumechange': Event;
    'waiting': Event;
  }

  // Déclaration pour les événements de souris et de clavier
  interface MouseEvent extends UIEvent {
    // Propriétés et méthodes des événements de souris
  }

  interface KeyboardEvent extends UIEvent {
    // Propriétés et méthodes des événements de clavier
    key: string;
    code: string;
    keyCode: number;
    shiftKey: boolean;
    ctrlKey: boolean;
    altKey: boolean;
    metaKey: boolean;
    repeat: boolean;
    isComposing: boolean;
    getModifierState(keyArg: string): boolean;
  }

  // Déclaration pour les éléments DOM de base
  interface HTMLElement extends Element {
    // Propriétés et méthodes des éléments HTML
    id: string;
    className: string;
    classList: DOMTokenList;
    style: CSSStyleDeclaration;
    innerHTML: string;
    textContent: string | null;
    hidden: boolean;
    title: string;
    lang: string;
    tabIndex: number;
    accessKey: string;
    dataset: DOMStringMap;
    contentEditable: string;
    isContentEditable: boolean;
    offsetParent: Element | null;
    offsetTop: number;
    offsetLeft: number;
    offsetWidth: number;
    offsetHeight: number;
    clientTop: number;
    clientLeft: number;
    clientWidth: number;
    clientHeight: number;
    scrollTop: number;
    scrollLeft: number;
    scrollWidth: number;
    scrollHeight: number;
    oncopy: ((this: HTMLElement, ev: ClipboardEvent) => any) | null;
    oncut: ((this: HTMLElement, ev: ClipboardEvent) => any) | null;
    onpaste: ((this: HTMLElement, ev: ClipboardEvent) => any) | null;
    onanimationcancel: ((this: HTMLElement, ev: AnimationEvent) => any) | null;
    onanimationend: ((this: HTMLElement, ev: AnimationEvent) => any) | null;
    onanimationiteration: ((this: HTMLElement, ev: AnimationEvent) => any) | null;
    onanimationstart: ((this: HTMLElement, ev: AnimationEvent) => any) | null;
    ontransitioncancel: ((this: HTMLElement, ev: TransitionEvent) => any) | null;
    ontransitionend: ((this: HTMLElement, ev: TransitionEvent) => any) | null;
    ontransitionrun: ((this: HTMLElement, ev: TransitionEvent) => any) | null;
    ontransitionstart: ((this: HTMLElement, ev: TransitionEvent) => any) | null;
    onblur: ((this: HTMLElement, ev: FocusEvent) => any) | null;
    onerror: OnErrorEventHandler;
    onfocus: ((this: HTMLElement, ev: FocusEvent) => any) | null;
    onload: ((this: HTMLElement, ev: Event) => any) | null;
    onresize: ((this: HTMLElement, ev: UIEvent) => any) | null;
    onscroll: ((this: HTMLElement, ev: Event) => any) | null;
    onwheel: ((this: HTMLElement, ev: WheelEvent) => any) | null;
    onfullscreenchange: ((this: HTMLElement, ev: Event) => any) | null;
    onfullscreenerror: ((this: HTMLElement, ev: Event) => any) | null;
    onpointercancel: ((this: HTMLElement, ev: PointerEvent) => any) | null;
    onpointerdown: ((this: HTMLElement, ev: PointerEvent) => any) | null;
    onpointerenter: ((this: HTMLElement, ev: PointerEvent) => any) | null;
    onpointerleave: ((this: HTMLElement, ev: PointerEvent) => any) | null;
    onpointermove: ((this: HTMLElement, ev: PointerEvent) => any) | null;
    onpointerout: ((this: HTMLElement, ev: PointerEvent) => any) | null;
    onpointerover: ((this: HTMLElement, ev: PointerEvent) => any) | null;
    onpointerup: ((this: HTMLElement, ev: PointerEvent) => any) | null;
    ongotpointercapture: ((this: HTMLElement, ev: PointerEvent) => any) | null;
    onlostpointercapture: ((this: HTMLElement, ev: PointerEvent) => any) | null;
    onclick: ((this: HTMLElement, ev: MouseEvent) => any) | null;
    ondblclick: ((this: HTMLElement, ev: MouseEvent) => any) | null;
    onmousedown: ((this: HTMLElement, ev: MouseEvent) => any) | null;
    onmouseenter: ((this: HTMLElement, ev: MouseEvent) => any) | null;
    onmouseleave: ((this: HTMLElement, ev: MouseEvent) => any) | null;
    onmousemove: ((this: HTMLElement, ev: MouseEvent) => any) | null;
    onmouseout: ((this: HTMLElement, ev: MouseEvent) => any) | null;
    onmouseover: ((this: HTMLElement, ev: MouseEvent) => any) | null;
    onmouseup: ((this: HTMLElement, ev: MouseEvent) => any) | null;
    onkeydown: ((this: HTMLElement, ev: KeyboardEvent) => any) | null;
    onkeypress: ((this: HTMLElement, ev: KeyboardEvent) => any) | null;
    onkeyup: ((this: HTMLElement, ev: KeyboardEvent) => any) | null;
    onauxclick: ((this: HTMLElement, ev: MouseEvent) => any) | null;
    oncontextmenu: ((this: HTMLElement, ev: MouseEvent) => any) | null;
    ondrag: ((this: HTMLElement, ev: DragEvent) => any) | null;
    ondragend: ((this: HTMLElement, ev: DragEvent) => any) | null;
    ondragenter: ((this: HTMLElement, ev: DragEvent) => any) | null;
    ondragexit: ((this: HTMLElement, ev: Event) => any) | null;
    ondragleave: ((this: HTMLElement, ev: DragEvent) => any) | null;
    ondragover: ((this: HTMLElement, ev: DragEvent) => any) | null;
    ondragstart: ((this: HTMLElement, ev: DragEvent) => any) | null;
    ondrop: ((this: HTMLElement, ev: DragEvent) => any) | null;
    onformdata: ((this: HTMLElement, ev: FormDataEvent) => any) | null;
    oninput: ((this: HTMLElement, ev: Event) => any) | null;
    oninvalid: ((this: HTMLElement, ev: Event) => any) | null;
    onreset: ((this: HTMLElement, ev: Event) => any) | null;
    onsearch: ((this: HTMLElement, ev: Event) => any) | null;
    onselect: ((this: HTMLElement, ev: Event) => any) | null;
    onselectionchange: ((this: HTMLElement, ev: Event) => any) | null;
    onselectstart: ((this: HTMLElement, ev: Event) => any) | null;
    onsubmit: ((this: HTMLElement, ev: SubmitEvent) => any) | null;
    ontouchcancel: ((this: HTMLElement, ev: TouchEvent) => any) | null;
    ontouchend: ((this: HTMLElement, ev: TouchEvent) => any) | null;
    ontouchmove: ((this: HTMLElement, ev: TouchEvent) => any) | null;
    ontouchstart: ((this: HTMLElement, ev: TouchEvent) => any) | null;
    onvisibilitychange: ((this: HTMLElement, ev: Event) => any) | null;
  }
}

export {};
