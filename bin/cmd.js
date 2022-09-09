#!/usr/bin/env node
"use strict";
import fs from "fs";
import path from "path";

// Polyfill for es6 import support
import { createRequire } from "module";
const meow = createRequire(import.meta.url)("meow");

import { extract } from "../lib/har-extractor.js";

const cli = meow(
    `
    Usage
      $ har-extractor-easy <harfile> [--output ./output/path]

    Options:
      --output, -o Output directory (Default = ./har)
      --remove-query-string, -r Remove query string from file path (Default = true)
      --dry-run Enable dry run mode (Default = false)
      --verbose Show processing file path (Default = true)

    Examples
      $ har-extractor-easy ./net.har
      (Extracts to new ./har directory)
`,
    {
        flags: {
            output: {
                type: "string",
                alias: "o",
                default: "./har",
            },
            removeQueryString: {
                type: "boolean",
                alias: "r",
                default: true,
            },
            verbose: {
                type: "boolean",
                default: true,
            },
            dryRun: {
                type: "boolean",
                default: false,
            },
        },
        autoHelp: true,
    }
);

const harFilePath = cli.input[0];
if (!harFilePath) {
    cli.showHelp();
}
try {
    const harContent = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), harFilePath), "utf-8"));
    extract(harContent, {
        verbose: cli.flags.verbose,
        dryRun: cli.flags.dryRun,
        removeQueryString: cli.flags.removeQueryString,
        outputDir: cli.flags.output,
    });
} catch (error) {
    console.error(error);
    cli.showHelp();
}
