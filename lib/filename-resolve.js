import * as fs from "fs";
import * as path from "path";
//@ts-ignore
import filenamify from "filenamify";
//@ts-ignore
import humanizeUrl from "humanize-url";
import { mimeMap } from "./mime-resolver.js";
var knownNewPaths = [];
var hasSameName = function (file) { return knownNewPaths.includes(file); };
export var getAvailableFilename = function (file) {
    var extension = path.extname(file);
    var basename = path.basename(file, path.extname(file));
    var outputPath = file;
    var fId = 1;
    while (hasSameName(outputPath) || fs.existsSync(outputPath)) {
        outputPath = path.join(path.dirname(file), basename + fId + extension);
        fId = fId + 1;
    }
    knownNewPaths.push(outputPath);
    return outputPath;
};
var resolveEntryForKnownMime = function (props) {
    var mimeInfo = props.mimeInfo, outputFileName = props.outputFileName, buffer = props.buffer, dirnames = props.dirnames;
    var extension = mimeInfo.extension;
    var pretty = mimeInfo.pretty;
    var defaultFilename = mimeInfo.defaultFilename;
    var updatedBuffer = pretty === undefined ? buffer : pretty(buffer);
    if (defaultFilename !== undefined && (!outputFileName || !outputFileName.includes(extension))) {
        return { uniquePath: dirnames.join("/") + defaultFilename, updatedBuffer: buffer };
    }
    else {
        var addExtension = outputFileName.includes(extension) ? "" : extension;
        dirnames[dirnames.length - 1] = outputFileName + addExtension;
        return { uniquePath: dirnames.join("/"), updatedBuffer: updatedBuffer };
    }
};
export var convertEntryAsFilePathFormat = function (buffer, entry, removeQueryString) {
    if (removeQueryString === void 0) { removeQueryString = false; }
    var requestURL = entry.request.url;
    var stripSchemaURL = humanizeUrl(removeQueryString ? requestURL.split("?")[0] : requestURL);
    var dirnames = stripSchemaURL.split("/").map(function (pathname) {
        return filenamify(pathname, { maxLength: 255 });
    });
    var outputFileName = dirnames[dirnames.length - 1];
    var mime = entry.response.content.mimeType;
    var mimeInfo = mimeMap[mime];
    if (mimeInfo === undefined) {
        return { uniquePath: dirnames.join("/"), updatedBuffer: buffer };
    }
    else {
        return resolveEntryForKnownMime({ mimeInfo: mimeInfo, outputFileName: outputFileName, buffer: buffer, dirnames: dirnames });
    }
};
//# sourceMappingURL=filename-resolve.js.map