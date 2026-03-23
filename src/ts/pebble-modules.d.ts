declare module 'ui' {
  interface CardOptions {
    title?: string;
    subtitle?: string;
    body?: string;
    scrollable?: boolean;
  }

  class Card {
    constructor(opts?: CardOptions);
    title(t: string): void;
    subtitle(t: string): void;
    body(t: string): void;
    show(): void;
    hide(): void;
    on(event: 'click', button: 'up' | 'select' | 'down' | 'back', callback: () => void): void;
  }

  export { Card, CardOptions };
}

declare module 'ajax' {
  interface AjaxOptions {
    url: string;
    method?: string;
    type?: string;
    data?: any;
    headers?: Record<string, string>;
    cache?: boolean;
  }

  function ajax(
    opts: AjaxOptions,
    success?: (data: any, status: number, request: any) => void,
    failure?: (error: any, status: number, request: any) => void
  ): void;

  export = ajax;
}

declare module 'settings' {
  interface ConfigOptions {
    url: string;
    autoSave?: boolean;
    hash?: boolean;
  }

  function config(
    opts: ConfigOptions,
    open?: (e: any) => void,
    close?: (e: { failed: boolean; options: any }) => void
  ): void;
  function option(): any;
  function option(key: string): any;
  function option(key: string, value: any): void;
  function option(opts: Record<string, any>): void;
  export { config, option };
}

declare module 'ui/vibe' {
  function vibrate(type?: 'short' | 'long' | 'double'): void;
  export { vibrate };
}
