// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="@emotion/react/types/css-prop" />

type CSSModule = Record<string, string>;

// type shims for CSS modules

declare module '*.module.scss' {
  const cssModule: CSSModule;
  export = cssModule;
}

declare module '*.module.css' {
  const cssModule: CSSModule;
  export = cssModule;
}

declare module '*.png';

declare module '*.ico' {
  const ico: any;
  export = ico;
}

declare module 'rehype-react' {
  type RehypeOptions = {
    createElement: any;
    components: any;
  };
  class RehypeReact {
    Compiler: any;
    constructor(options: RehypeOptions);
  }
  export default RehypeReact;
}
