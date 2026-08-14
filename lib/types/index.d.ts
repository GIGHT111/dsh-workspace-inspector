export declare const name: string;
export declare const inject: string[];
export interface Config {
    /** 单层目录最多返回的条目数；超出截断并置 truncated。 */
    maxEntriesPerDir: number;
}
export declare const Config: any;
export declare function apply(ctx: any, config: Config): void;
