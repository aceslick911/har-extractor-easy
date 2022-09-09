import * as fs from "fs";
import { Har, Entry } from "har-format";
import * as path from "path";

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
    const fileName = dirnames[dirnames.length - 1];

    if (
        fileName &&
        !fileName.includes(".html") &&
        entry.response.content.mimeType &&
        entry.response.content.mimeType.includes("text/html")
    ) {
        return { uniquePath: dirnames.join("/") + "/index.html", updatedBuffer: buffer };
    } else if (entry.response.content.mimeType && entry.response.content.mimeType.includes("application/json")) {
        if (fileName && !fileName.includes(".json")) {
            return { uniquePath: dirnames.join("/") + ".json", updatedBuffer: prettifyBufferJSON(buffer) };
        }
        return { uniquePath: dirnames.join("/"), updatedBuffer: prettifyBufferJSON(buffer) };
    }

    return { uniquePath: dirnames.join("/"), updatedBuffer: buffer };
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
