import * as fs from "fs";
import * as path from "path";
import knownMIME from "mime-db";
import { Entry } from "har-format";

//@ts-ignore
import filenamify from "filenamify";
//@ts-ignore
import humanizeUrl from "humanize-url";

const prettifyBufferJSON = (buffer: Buffer): Buffer => {
    const json = JSON.parse(buffer.toString());
    const prettyJSON = JSON.stringify(json, null, 2);
    return Buffer.from(prettyJSON);
};

const knownMimeMap = Object.keys(knownMIME)
    .map((v: keyof typeof knownMIME) => {
        const extensions = knownMIME[v].extensions;
        if (extensions === undefined) {
            return null;
        } else {
            return { key: v, extension: "." + extensions[0] };
        }
    })
    .filter((v) => v !== null) as { key: string; extension: string }[];

const filteredMimeMap = knownMimeMap.reduce((acc, curr) => ({ ...(acc || {}), [curr.key]: curr }), {});

interface MimeInfo {
    extension: string;
    pretty?: (buffer: Buffer) => Buffer;
    defaultFilename?: string;
}

type MimeMapper = {
    [key in string]: MimeInfo;
};
const mimeMap: MimeMapper = {
    ...filteredMimeMap,
    "application/json": {
        extension: ".json",
        pretty: prettifyBufferJSON,
    },
    "text/javascript": {
        extension: ".js",
        defaultFilename: "script.js",
    },
    "text/html": {
        extension: ".html",
        defaultFilename: "index.html",
    },
    "image/png": {
        extension: ".png",
    },
    "image/gif": {
        extension: ".gif",
    },
    "image/bmp": {
        extension: ".bmp",
    },
};

const knownNewPaths: string[] = [];

const hasSameName = (file: string) => knownNewPaths.includes(file);

export const getAvailableFilename = (file: string) => {
    const extension = path.extname(file);
    const basename = path.basename(file, path.extname(file));

    let outputPath = file;

    let fId = 1;
    while (hasSameName(outputPath) || fs.existsSync(outputPath)) {
        outputPath = path.join(path.dirname(file), basename + fId + extension);
        fId = fId + 1;
    }

    knownNewPaths.push(outputPath);

    return outputPath;
};

const resolveEntryForKnownMime = (props: {
    mimeInfo: MimeInfo;
    outputFileName: string;
    buffer: Buffer;
    dirnames: string[];
}) => {
    const { mimeInfo, outputFileName, buffer, dirnames } = props;

    const extension = mimeInfo.extension;
    const pretty = mimeInfo.pretty;
    const defaultFilename = mimeInfo.defaultFilename;

    const updatedBuffer = pretty === undefined ? buffer : pretty(buffer);

    if (defaultFilename !== undefined && (!outputFileName || !outputFileName.includes(extension))) {
        return { uniquePath: dirnames.join("/") + defaultFilename, updatedBuffer: buffer };
    } else {
        const addExtension = outputFileName.includes(extension) ? "" : extension;
        dirnames[dirnames.length - 1] = outputFileName + addExtension;
        return { uniquePath: dirnames.join("/"), updatedBuffer };
    }
};

export const convertEntryAsFilePathFormat = (
    buffer: Buffer,
    entry: Entry,
    removeQueryString: boolean = false
): { uniquePath: string; updatedBuffer: Buffer } => {
    const requestURL = entry.request.url;
    const stripSchemaURL: string = humanizeUrl(removeQueryString ? requestURL.split("?")[0] : requestURL);
    const dirnames: string[] = stripSchemaURL.split("/").map((pathname) => {
        return filenamify(pathname, { maxLength: 255 });
    });
    const outputFileName = dirnames[dirnames.length - 1];

    const mime = entry.response.content.mimeType;
    const mimeInfo = mimeMap[mime];
    if (mimeInfo === undefined) {
        return { uniquePath: dirnames.join("/"), updatedBuffer: buffer };
    } else {
        return resolveEntryForKnownMime({ mimeInfo, outputFileName, buffer, dirnames });
    }
};
