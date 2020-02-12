#!/usr/bin/env node
const fs = require("fs");
const {Resolver} = require("dns").promises;
const resolver = new Resolver();

const {AWS} = require("./providers");
const aws = new AWS();

const argv = require("yargs")
    // .command("*", "default command", () => {}, (argv) => {
    //     console.log("default command.");
    // })
    .command("file <filename>", "lookup hosts in specified file", () => {}, 
        async (argv) => {
            if (!fs.existsSync(argv.filename)) {
                return die(`File '${argv.filename}' not found.`);
            }
            const fileContents = fs.readFileSync(argv.filename).toString();
            const hostnameLines = fileContents.split("\n");
            for (let hostname of hostnameLines) {
                await outputHostnameResults(hostname);
            }
    })
    .command("host <hostname>", "lookup specified hostname", () => {}, 
        async (argv) => {
            await outputHostnameResults(argv.hostname);
    })
    .demandCommand()
    .version("0.1")
    .argv;

async function outputHostnameResults(hostname){
    const results = await resolve(hostname);
    console.log(`${hostname}\t${results.isAWS}`);
}

async function resolve(hostname) {
    const addresses = await resolver.resolve4(hostname);
    const isAWS = await aws.checkAddresses(addresses);
    
    return {isAWS};
}

function die(error) {
    console.log(error);
    process.exit(-1);
}