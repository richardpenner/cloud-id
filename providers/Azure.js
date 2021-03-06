const CIDRMatcher = require("cidr-matcher");
const fetch = require("node-fetch");
const fs = require("fs");
// TODO: this seems to change. Go here: https://www.microsoft.com/en-us/download/details.aspx?id=56519 then copy the "click here to download manually" link
const AZURE_IP_RANGES = "https://download.microsoft.com/download/7/1/D/71D86715-5596-4529-9B13-DA13A5DE5B63/ServiceTags_Public_20201019.json";
const AZURE_IP_RANGES_LOCAL = "./provider-ips/azure.json";

class Azure {
    constructor() {
    }

    async createMatcher() {
        try {
            let list;
            if (fs.existsSync(AZURE_IP_RANGES_LOCAL)) {
                list = JSON.parse(fs.readFileSync(AZURE_IP_RANGES_LOCAL));
            }
            else {
                const response = await fetch(AZURE_IP_RANGES);
                list = await response.json();
            }
            const ipPrefixes = list.values.map(value => {
                return value.properties.addressPrefixes;
            }).flat();
            const matcher = new CIDRMatcher(ipPrefixes);
            return matcher;
        }
        catch (err) {
            console.log(`Caught error creating Azure matcher: ${err}`);
            throw err;
        }
    }

    async checkAddresses(address) {
        if (this._matcher == null) {
            this._matcher = await this.createMatcher();
        }
        if (Array.isArray(address)) {
            return address.map(a => {
                return this._matcher.contains(a);
            });
        }

        return this._matcher.contains(address);
    }
}

module.exports = Azure;