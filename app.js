#!/usr/bin/env node
const fs = require("fs");
const {Resolver} = require("dns").promises;
const resolver = new Resolver();
const {parseAsync} = require("json2csv");
const {URL} = require("url");
const cliProgress = require("cli-progress");

const {AWS, GCP, Azure} = require("./providers");
const aws = new AWS();
const gcp = new GCP();
const azure = new Azure();


process.on("uncaughtException", die);

require("yargs")
    .command("file <filename>", "lookup hosts in specified file", () => {}, 
        async (argv) => {
            if (!fs.existsSync(argv.filename)) {
                return die(`File '${argv.filename}' not found.`);
            }
            const fileContents = fs.readFileSync(argv.filename).toString();
            const hostnameLines = fileContents.split("\n");
            let results = [];
            const bar = new cliProgress.SingleBar({etaBuffer: 1000}, cliProgress.Presets.shades_classic);
            bar.start(hostnameLines.length, 0);
            let idx = 0;
            for (let hostname of hostnameLines) {
                const result = await resolve(hostname);
                results = results.concat(result);
                bar.increment();
            }
            bar.stop();
            await outputHostnameResults(argv, results);
    })
    .command("host <hostname>", "lookup specified hostname", () => {}, 
        async (argv) => {
            const result = await resolve(argv.hostname);
            await outputHostnameResults(argv,result);
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
    const humanOutput = (argv.csv == null);
    if (argv.json) {
        console.log(results);
    }
    else if (humanOutput) {
        console.table(results);
    }
    else {
        try {
            const fields = ["hostname", "address", "provider"];
            const opts = {fields};
            const csv = await parseAsync(results, opts);
            console.log(csv);
        }
        catch (err) {
            return die(err);
        }
    }
}

async function resolve(hostnameOrURL) {
    let hostname = hostnameOrURL;
    let addresses = [];
    try {
        const url = new URL(hostnameOrURL);
        hostname = url.hostname;
    }
    catch {}
    try {
        addresses = await resolver.resolve4(hostname);
        const results = [];
        for (let address of addresses) {
            const isAWS = await aws.checkAddresses(address);
            const isAzure = (!isAWS && await azure.checkAddresses(address));
            const isGCP = (!isAWS && !isAzure && await gcp.checkAddresses(address));
            let provider = "unknown";
            if (isAWS) {
                provider = "amazon";
            }
            else if (isAzure) {
                provider = "azure";
            }
            else if (isGCP) {
                provider = "google";
            }
            results.push({hostname, address, provider});
        }
        return results;
    }
    catch (err) {
        return [{hostname, address: "unknown", provider: "unknown"}];
    }
}

function die(error) {
    console.log(error);
    process.exit(-1);
}