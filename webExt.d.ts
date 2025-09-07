declare module 'web-ext' {
  export const cmd: Commands;

  export interface Commands {
    build(
      params: BuildParams,
      options?: BuildOptions,
    ): Promise<{ extensionPath: string }>;
  }

  export interface BuildParams {
    sourceDir: string;
    artifactsDir: string;
    /** Default — false */
    asNeeded?: boolean;
    /** Default — false */
    overwriteDest?: boolean;
    ignoreFiles?: string[];
    filename?: string;
  }

  export interface BuildOptions {
    /** Default — true */
    showReadyMessage?: boolean;
  }
}
