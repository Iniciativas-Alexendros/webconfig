declare module "tar-stream" {
  interface Extract {
    on(event: "entry", listener: (header: Header, stream: NodeJS.ReadableStream, next: () => void) => void): this;
    on(event: "finish", listener: () => void): this;
    on(event: "error", listener: (err: Error) => void): this;
  }
  interface Header {
    name: string;
    size: number;
    mode: number;
    mtime: Date;
    type: string;
  }
  interface Pack extends NodeJS.WritableStream {
    entry(header: Header, callback?: () => void): this;
    finalize(): void;
  }
  function extract(): Extract;
  function pack(): Pack;
  export { extract, pack };
}