#!/usr/bin/env node
const fs = require("fs");
const {Resolver} = require("dns").promises;
const resolver = new Resolver();

const {AWS, GCP} = require("./providers");
const aws = new AWS();
const gcp = new GCP();

const {URL} = require("url");

const argv = require("yargs")
    .command("file <filename>", "lookup hosts in specified file", () => {}, 
        async (argv) => {
            if (!fs.existsSync(argv.filename)) {
                return die(`File '${argv.filename}' not found.`);
            }
            const fileContents = fs.readFileSync(argv.filename).toString();
            const hostnameLines = fileContents.split("\n");
            outputHeader();
            for (let hostname of hostnameLines) {
                await outputHostnameResults(hostname);
            }
    })
    .command("host <hostname>", "lookup specified hostname", () => {}, 
        async (argv) => {
            outputHeader();
            await outputHostnameResults(argv.hostname);
    })
    .demandCommand(1, "You must specify at least one command")
    .strict()
    .version("1.0.0")
    .fail((msg, error, yargs) => {
        console.error(`Error: ${error}`);
        process.exit(1);
    })
    .argv;

function outputHeader() {
    console.log(`Hostname\tIP\tAWS\tGCP`);
}

async function outputHostnameResults(hostname){
    const results = await resolve(hostname);
    for (let result of results) {
        console.log(`${hostname}\t${result.address}\t${result.isAWS}\t${result.isGCP}`);
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
        const isGCP = await gcp.checkAddresses(address);
        results.push({address, isAWS, isGCP});
    }

    return results;
}

function die(error) {
    console.log(error);
    process.exit(-1);
}