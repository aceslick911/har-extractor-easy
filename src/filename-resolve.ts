import * as fs from "fs";
import * as path from "path";
import { Entry } from "har-format";

//@ts-ignore
import filenamify from "filenamify";
//@ts-ignore
import humanizeUrl from "humanize-url";
import { MimeInfo, mimeMap } from "./mime-resolver.js";

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
