var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import * as fs from "fs";
import * as path from "path";
import knownMIME from "mime-db";
//@ts-ignore
import filenamify from "filenamify";
//@ts-ignore
import humanizeUrl from "humanize-url";
var prettifyBufferJSON = function (buffer) {
    var json = JSON.parse(buffer.toString());
    var prettyJSON = JSON.stringify(json, null, 2);
    return Buffer.from(prettyJSON);
};
var knownMimeMap = Object.keys(knownMIME)
    .map(function (v) {
    var extensions = knownMIME[v].extensions;
    if (extensions === undefined) {
        return null;
    }
    else {
        return { key: v, extension: "." + extensions[0] };
    }
})
    .filter(function (v) { return v !== null; });
var filteredMimeMap = knownMimeMap.reduce(function (acc, curr) {
    var _a;
    return (__assign(__assign({}, (acc || {})), (_a = {}, _a[curr.key] = curr, _a)));
}, {});
var mimeMap = __assign(__assign({}, filteredMimeMap), { "application/json": {
        extension: ".json",
        pretty: prettifyBufferJSON,
    }, "text/javascript": {
        extension: ".js",
        defaultFilename: "script.js",
    }, "text/html": {
        extension: ".html",
        defaultFilename: "index.html",
    }, "image/png": {
        extension: ".png",
    }, "image/gif": {
        extension: ".gif",
    }, "image/bmp": {
        extension: ".bmp",
    } });
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