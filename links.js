const url = require('url'); // node built-in module
const request = require('request'); // fetched via npm, simpler than built-in http/https
const chalk = require('chalk'); // fetched via npm

function logGreen(s) {
    console.log(chalk.green(s));
}

function logBlue(s) {
    console.log(chalk.blue(s));
}

// returns part of s that is after the equal sign and any trailing whitespace
function afterEquals(s) {
    const a = s.split(/=\s*/);
    if (a.length>=2) {
        return a[1];
    }
    return "";
}

// returns first substring of string s describing an HTML href attribute
function firstHref(s) {
    const t = s.match( /[hH][rR][eE][fF]\s*=\s*(('[^']*')|("[^"]*"))/);
    if (t !== null) {
        return t[0];
    }
    return "";
}

// returns substring of s omitting first and last character
// intended to remove quotes from around an HTML tag attribute
function stripFirstLast(s) {
    if (s !== undefined && s.length >= 2) {
        return s.substring(1, s.length - 1);
    }
    return "";
}

// returns a, or if a is null, returns an empty array
// intended to replace null returns from string match method
function nullToEmptyArray(a) {
    if (a !== null) {
        return a;
    }
    return [];
}

function extractLinks(responseObj) {
    const html = responseObj.body;
    const baseURL = responseObj.url;
    const tagRegex = /<\s*[aA]\s+[^>]*>/g; // "<"" followed by optional whitespace
                                           // followed by "a" or "A" followed by
                                           // at least one whitespace followed by an
                                           // arbitrary number of non-">" characters
                                           // followed by a ">"
    const tagMatches = html.match(tagRegex).map(nullToEmptyArray);
    const attribMatches = tagMatches.map(firstHref);
    const srcDestPairs = attribMatches.map(afterEquals).
        map(stripFirstLast).
        filter(s=> s.length > 0).
        map(targetURL => [baseURL, url.resolve(baseURL, targetURL)]);
    return srcDestPairs;
}

function reportLinks(srcDestPairs) {
    const n = srcDestPairs.length;
    for (let i = 0; i < n; i = i + 1) {
        const pair = srcDestPairs[i];
        logGreen(pair[0] + " => " + pair[1]);
    }
    return srcDestPairs;
}

function makePromise(uri) {
    // Setting URL and headers for request
    const options = {
        uri: uri,
        method: "GET",
        headers: {'User-Agent': 'Mozilla'}
    };
    // Return new promise 
    return new Promise(function(resolve, reject) {
        // Do async job
        request(options, function(err, resp, body) {
            if (err) {
                reject(err);
            } else {
                resolve({
                    body: body,
                    url: uri,
                    resp: resp
                });
            }
        })
    })

}

function main() {
    const urls = [
        'http://www.bsu.edu/',
        'http://www.microsoft.com/',
        'http://www.intel.com/',
        'http://www.google.com/'
    ];
    
    for (let urlIndex = 0; urlIndex<urls.length; urlIndex++) {
        const promise = makePromise(urls[urlIndex]);
        promise.then(extractLinks, err=>console.error(err)).
                then(reportLinks, err=>console.error(err));
    }
}

main();