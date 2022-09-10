import * as fs from "fs";
import { Har, Entry } from "har-format";
import * as path from "path";
import knownMIME from "mime-db";

//@ts-ignore
import filenamify from "filenamify";
//@ts-ignore
import humanizeUrl from "humanize-url";
//@ts-ignore
import makeDir from "make-dir";

export const getEntryContentAsBuffer = (entry: Entry): Buffer | undefined => {
    const content = entry.response.content;
    const text = content.text;
    if (text === undefined) {
        return;
    }
    if (content.encoding === "base64") {
        return Buffer.from(text, "base64");
    } else {
        return Buffer.from(text);
    }
};

const fPaths: string[] = [];

const hasSameName = (file: string) => fPaths.includes(file);

function uniqueFile(file: string) {
    const extension = path.extname(file);
    const basename = path.basename(file, path.extname(file));

    let out = file;

    let fId = 1;
    while (hasSameName(out)) {
        out = path.join(path.dirname(file), basename + fId + extension);
        fId = fId + 1;
    }

    return out;
}

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

const filteredMap = knownMimeMap.reduce((acc, curr) => ({ ...(acc || {}), [curr.key]: curr }), {});

const mimeMap: {
    [key in string]: {
        extension: string;
        pretty?: (buffer: Buffer) => Buffer;
        defaultFilename?: string;
    };
} = {
    ...filteredMap,
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
        const extension = mimeInfo.extension;
        const pretty = mimeInfo.pretty;
        const defaultFilename = mimeInfo.defaultFilename;

        console.log("process", mimeInfo, outputFileName, extension, pretty, defaultFilename);

        const updatedBuffer = pretty === undefined ? buffer : pretty(buffer);

        console.log("TEST", {
            A: defaultFilename !== undefined, //false
            B: !outputFileName, //false
            C: !outputFileName.includes(extension), //true
        });

        if (defaultFilename !== undefined && (!outputFileName || !outputFileName.includes(extension))) {
            console.log("!! DEFAULT");
            //  dirnames[dirnames.length - 1] = defaultFilename;
            return { uniquePath: dirnames.join("/") + defaultFilename, updatedBuffer: buffer };
        } else {
            console.log("!! DEFAULT2");
            const addExtension = outputFileName.includes(extension) ? "" : extension;
            dirnames[dirnames.length - 1] = outputFileName + addExtension;
            return { uniquePath: dirnames.join("/"), updatedBuffer };
        }
    }

    // if (
    //     outputFileName &&
    //     !outputFileName.includes(".html") &&
    //     entry.response.content.mimeType &&
    //     entry.response.content.mimeType.includes("text/html")
    // ) {
    //     return { uniquePath: dirnames.join("/") + "/index.html", updatedBuffer: buffer };
    // } else if (entry.response.content.mimeType && entry.response.content.mimeType.includes("application/json")) {
    //     if (outputFileName && !outputFileName.includes(".json")) {
    //         return { uniquePath: dirnames.join("/") + ".json", updatedBuffer: prettifyBufferJSON(buffer) };
    //     }
    //     return { uniquePath: dirnames.join("/"), updatedBuffer: prettifyBufferJSON(buffer) };
    // }
};

export interface ExtractOptions {
    outputDir: string;
    verbose?: boolean;
    dryRun?: boolean;
    removeQueryString?: boolean;
}

export const extract = (harContent: Har, options: ExtractOptions) => {
    harContent.log.entries.forEach(async (entry) => {
        const buffer = getEntryContentAsBuffer(entry);
        if (!buffer) {
            return;
        }
        const { uniquePath, updatedBuffer } = convertEntryAsFilePathFormat(buffer, entry, options.removeQueryString);

        const outputPath = uniqueFile(path.join(options.outputDir, uniquePath));
        fPaths.push(outputPath);
        if (!options.dryRun) {
            makeDir.sync(path.dirname(outputPath));
        }
        if (options.verbose) {
            console.log(outputPath);
        }
        if (!options.dryRun) {
            fs.writeFileSync(outputPath, updatedBuffer);
        }
    });
};
