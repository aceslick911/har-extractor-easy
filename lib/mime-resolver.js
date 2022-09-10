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
import knownMIME from "mime-db";
import { prettifyBufferJSON } from "./data-utils.js";
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
export var mimeMap = __assign(__assign({}, filteredMimeMap), { "application/json": {
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
//# sourceMappingURL=mime-resolver.js.map