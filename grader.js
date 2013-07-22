#!/usr/bin/env node
// Check for presence of various HTML tags and attributes at a given URL.

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var restler = require('restler');

var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if (!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1);
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for (var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var checkUrl = function(url, checksfile) {
    restler.get(url).on('complete', function(result) {
        if (result instanceof Error) {
            process.exit(1);
        } else {
            // TODO: Refactor with above function.
            $ = cheerio.load(result);
            var out = {};
            var checks = loadChecks(checksfile).sort();
            for (var ii in checks) {
                var present = $(checks[ii]).length > 0;
                out[checks[ii]] = present;
            }
            console.log(JSON.stringify(out, null, 4));
        }
    });
};

var clone = function(fn) {
    return fn.bind({});
};

if (require.main == module) {
    program.option('-c, --checks <check_file>', 'Path to checks.json',
                   clone(assertFileExists), CHECKSFILE_DEFAULT)
           .option('-f, --file <html_file>', 'Path to local file to check',
                   clone(assertFileExists), HTMLFILE_DEFAULT)
           .option('-u, --url <url>', 'Path to file accessible over http to check', '')
           .parse(process.argv);

    if (program.url.length > 0) {  // Overrides --file.
        checkUrl(program.url, program.checks);
    } else {
        var checkJson = checkHtmlFile(program.file, program.checks);
        var outJson = JSON.stringify(checkJson, null, 4);
        console.log(outJson);
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
