var __awaiter =
    (this && this.__awaiter) ||
    function (thisArg, _arguments, P, generator) {
        function adopt(value) {
            return value instanceof P
                ? value
                : new P(function (resolve) {
                      resolve(value);
                  });
        }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) {
                try {
                    step(generator.next(value));
                } catch (e) {
                    reject(e);
                }
            }
            function rejected(value) {
                try {
                    step(generator["throw"](value));
                } catch (e) {
                    reject(e);
                }
            }
            function step(result) {
                result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
            }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
var __generator =
    (this && this.__generator) ||
    function (thisArg, body) {
        var _ = {
                label: 0,
                sent: function () {
                    if (t[0] & 1) throw t[1];
                    return t[1];
                },
                trys: [],
                ops: [],
            },
            f,
            y,
            t,
            g;
        return (
            (g = { next: verb(0), throw: verb(1), return: verb(2) }),
            typeof Symbol === "function" &&
                (g[Symbol.iterator] = function () {
                    return this;
                }),
            g
        );
        function verb(n) {
            return function (v) {
                return step([n, v]);
            };
        }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_)
                try {
                    if (
                        ((f = 1),
                        y &&
                            (t =
                                op[0] & 2
                                    ? y["return"]
                                    : op[0]
                                    ? y["throw"] || ((t = y["return"]) && t.call(y), 0)
                                    : y.next) &&
                            !(t = t.call(y, op[1])).done)
                    )
                        return t;
                    if (((y = 0), t)) op = [op[0] & 2, t.value];
                    switch (op[0]) {
                        case 0:
                        case 1:
                            t = op;
                            break;
                        case 4:
                            _.label++;
                            return { value: op[1], done: false };
                        case 5:
                            _.label++;
                            y = op[1];
                            op = [0];
                            continue;
                        case 7:
                            op = _.ops.pop();
                            _.trys.pop();
                            continue;
                        default:
                            if (
                                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                                (op[0] === 6 || op[0] === 2)
                            ) {
                                _ = 0;
                                continue;
                            }
                            if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                                _.label = op[1];
                                break;
                            }
                            if (op[0] === 6 && _.label < t[1]) {
                                _.label = t[1];
                                t = op;
                                break;
                            }
                            if (t && _.label < t[2]) {
                                _.label = t[2];
                                _.ops.push(op);
                                break;
                            }
                            if (t[2]) _.ops.pop();
                            _.trys.pop();
                            continue;
                    }
                    op = body.call(thisArg, _);
                } catch (e) {
                    op = [6, e];
                    y = 0;
                } finally {
                    f = t = 0;
                }
            if (op[0] & 5) throw op[1];
            return { value: op[0] ? op[1] : void 0, done: true };
        }
    };
import * as fs from "fs";
import * as path from "path";
//@ts-ignore
import filenamify from "filenamify";
//@ts-ignore
import humanizeUrl from "humanize-url";
//@ts-ignore
import makeDir from "make-dir";
export var getEntryContentAsBuffer = function (entry) {
    var content = entry.response.content;
    var text = content.text;
    if (text === undefined) {
        return;
    }
    if (content.encoding === "base64") {
        return Buffer.from(text, "base64");
    } else {
        return Buffer.from(text);
    }
};
var fPaths = [];
var hasSameName = function (file) {
    return fPaths.includes(file);
};
function uniqueFile(file) {
    var extension = path.extname(file);
    var basename = path.basename(file, path.extname(file));
    var out = file;
    var fId = 1;
    while (hasSameName(out)) {
        console.log("DUPE!!", out);
        out = path.join(path.dirname(file), basename + fId + extension);
        fId = fId + 1;
    }
    console.log(file, out);
    return out;
}
var prettifyBufferJSON = function (buffer) {
    var json = JSON.parse(buffer.toString());
    var prettyJSON = JSON.stringify(json, null, 2);
    return Buffer.from(prettyJSON);
};
export var convertEntryAsFilePathFormat = function (buffer, entry, removeQueryString) {
    if (removeQueryString === void 0) {
        removeQueryString = false;
    }
    var requestURL = entry.request.url;
    var stripSchemaURL = humanizeUrl(removeQueryString ? requestURL.split("?")[0] : requestURL);
    var dirnames = stripSchemaURL.split("/").map(function (pathname) {
        return filenamify(pathname, { maxLength: 255 });
    });
    var fileName = dirnames[dirnames.length - 1];
    if (
        fileName &&
        !fileName.includes(".html") &&
        entry.response.content.mimeType &&
        entry.response.content.mimeType.includes("text/html")
    ) {
        return { uniquePath: dirnames.join("/") + "/index.html", updatedBuffer: buffer };
    } else if (
        fileName &&
        !fileName.includes(".json") &&
        entry.response.content.mimeType &&
        entry.response.content.mimeType.includes("application/json")
    ) {
        return { uniquePath: dirnames.join("/") + ".json", updatedBuffer: prettifyBufferJSON(buffer) };
    }
    return { uniquePath: dirnames.join("/"), updatedBuffer: buffer };
};
export var extract = function (harContent, options) {
    harContent.log.entries.forEach(function (entry) {
        return __awaiter(void 0, void 0, void 0, function () {
            var buffer, _a, uniquePath, updatedBuffer, filePath, outputPath;
            return __generator(this, function (_b) {
                buffer = getEntryContentAsBuffer(entry);
                if (!buffer) {
                    return [2 /*return*/];
                }
                (_a = convertEntryAsFilePathFormat(buffer, entry, options.removeQueryString)),
                    (uniquePath = _a.uniquePath),
                    (updatedBuffer = _a.updatedBuffer);
                filePath = path.join(options.outputDir, uniquePath);
                outputPath = uniqueFile(filePath);
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
                return [2 /*return*/];
            });
        });
    });
};
//# sourceMappingURL=har-extractor.js.map
