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

    async checkAddresses(ipAddress) {
        if (this._matcher == null) {
            this._matcher = await this.createMatcher();
        }
        if (Array.isArray(ipAddress)) {
            return this._matcher.containsAny(ipAddress);
        }

        return this._matcher.contains(ipAddress);
    }
}

module.exports = AWS;