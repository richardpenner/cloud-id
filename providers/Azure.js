const CIDRMatcher = require("cidr-matcher");
const fetch = require("node-fetch");

const AZURE_IP_RANGES = "https://download.microsoft.com/download/7/1/D/71D86715-5596-4529-9B13-DA13A5DE5B63/ServiceTags_Public_20200210.json";

class Azure {
    constructor() {
    }

    async createMatcher() {
        const response = await fetch(AZURE_IP_RANGES);
        const list = await response.json();
        const ipPrefixes = list.values.map(value => {
            return value.properties.addressPrefixes;
        }).flat();
        const matcher = new CIDRMatcher(ipPrefixes);

        return matcher;
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