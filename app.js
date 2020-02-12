#!/usr/bin/env node
const fs = require("fs");
const {Resolver} = require("dns").promises;
const resolver = new Resolver();
const {Parser} = require("json2csv");

const {AWS, GCP} = require("./providers");
const aws = new AWS();
const gcp = new GCP();

const {URL} = require("url");

require("yargs")
    .command("file <filename>", "lookup hosts in specified file", () => {}, 
        async (argv) => {
            if (!fs.existsSync(argv.filename)) {
                return die(`File '${argv.filename}' not found.`);
            }
            const fileContents = fs.readFileSync(argv.filename).toString();
            const hostnameLines = fileContents.split("\n");
            let results = [];
            for (let hostname of hostnameLines) {
                const result = await resolve(hostname);
                results = results.concat(result);
            }
            await outputHostnameResults(argv, results);
    })
    .command("host <hostname>", "lookup specified hostname", () => {}, 
        async (argv) => {
            const result = await resolve(argv.hostname);
            await outputHostnameResults(argv,[result]);
    })
    .demandCommand(1, "You must specify at least one command")
    .options({
        json: {
            describe: "Formats output as json",
            boolean: true
        },
        csv: {
            describe: "Formats the output as CSV",
            boolean: true
        },
        human: {
            describe: "Format the output for human reading (tabs)",
            boolean: true
        }
    })
    .strict()
    .version("1.0.0")
    .fail((msg, error, yargs) => {
        if (error) {
            console.error(`Error: ${error}`);
        }
        else {
            console.error(msg);
            yargs.showHelp();
            
        }
        process.exit(1);
    })
    .argv;

async function outputHostnameResults(argv, results){
    console.log(argv);
    if (argv.json) {
        console.log(results);
    }
    else {
        const fields = ["hostname", "address", "provider"];
        const opts = {fields};
        const humanOutput = (argv.csv == null);
        if (humanOutput) { 
            opts.delimiter = "\t";
            opts.quote = "";
        }
        const parser = new Parser(opts);
        const csv = parser.parse(results);
        console.log(csv);
    }
}

async function resolve(hostnameOrURL) {
    let hostname = hostnameOrURL;
    try {
        const url = new URL(hostnameOrURL);
        hostname = url.hostname;
    }
    catch {}
    const addresses = await resolver.resolve4(hostname);
    const results = [];
    for (let address of addresses) {
        const isAWS = await aws.checkAddresses(address);
        const isGCP = (!isAWS && await gcp.checkAddresses(address));
        let provider = "unknown";
        if (isAWS) {
            provider = "amazon";
        }
        else if (isGCP) {
            provider = "google";
        }
        results.push({hostname, address, provider});
    }

    return results;
}

function die(error) {
    console.log(error);
    process.exit(-1);
}