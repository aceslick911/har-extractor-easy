/// <reference types="node" />
export interface MimeInfo {
    extension: string;
    pretty?: (buffer: Buffer) => Buffer;
    defaultFilename?: string;
}
export declare type MimeMapper = {
    [key in string]: MimeInfo;
};
export declare const mimeMap: MimeMapper;
