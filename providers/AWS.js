const CIDRMatcher = require("cidr-matcher");
const fetch = require("node-fetch");

const AWS_IP_RANGES = "https://ip-ranges.amazonaws.com/ip-ranges.json";

class AWS {
    constructor() {
    }

    async createMatcher() {
        const response = await fetch(AWS_IP_RANGES);
        const list = await response.json();
        const ipPrefixes = list.prefixes.map(prefix => {
            return prefix.ip_prefix;
        });
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

module.exports = AWS;