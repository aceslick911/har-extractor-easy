/// <reference types="node" />
interface MimeInfo {
    extension: string;
    pretty?: (buffer: Buffer) => Buffer;
    defaultFilename?: string;
}
export declare type MimeMapper = {
    [key in string]: MimeInfo;
};
export declare const mimeMap: MimeMapper;
export declare const resolveEntryForKnownMime: (props: {
    mimeInfo: MimeInfo;
    outputFileName: string;
    buffer: Buffer;
    dirnames: string[];
}) => {
    uniquePath: string;
    updatedBuffer: Buffer;
};
export {};
