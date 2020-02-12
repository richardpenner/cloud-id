// adapted from https://github.com/bcoe/gce-ips/blob/master/index.js

const CIDRMatcher = require("cidr-matcher");
const { Resolver } = require("dns").promises;
const resolver = new Resolver();
const BLOCK_URL = "_cloud-netblocks.googleusercontent.com";
const CONCURRENCY = 4;
const Promise = require("bluebird");

class GCP {
    async checkAddresses(addresses) {
        if (this._ips == null) {
            this._ips = await this._lookup();
            this._matcher = new CIDRMatcher(this._ips);
        }
        if (Array.isArray(addresses)) {
            return addresses.map(address => {
                return this._matcher.contains(address);
            });
        }

        return this._matcher.contains(addresses);
    }
    async _lookup() {
        const blocks = await this._lookupNetBlocks();
        const ips = await this._lookupIps(blocks);

        return ips;
    }

    async _lookupNetBlocks(cb) {
        let results = await resolver.resolveTxt(BLOCK_URL);
        results = results[0]
        if (Array.isArray(results)) {
            results = results[0];
        }
        return this._parseBlocks(results);
    }

    _parseBlocks(textRecord) {
        const splitRecord = textRecord.split(' ');
        const blocks = [];
        splitRecord.forEach((record) => {
            if (~record.indexOf('include:')) {
                blocks.push(record.replace('include:', ''))
            }
        });
        return blocks
    }

    async _lookupIps(blocks, cb) {
        const _this = this;

        const ips = await Promise.map(blocks, async block => {
            let results = await resolver.resolveTxt(block);
            results = results[0];
            if (Array.isArray(results)) {
                results = results[0];
            }
            return _this._parseIps(results);
        }, {concurrency: CONCURRENCY});

        return ips.flat();
    }

    _parseIps(textRecord) {
        const splitRecord = textRecord.split(' ')
        const ips = []
        splitRecord.forEach((record) => {
            if (~record.indexOf('ip4:')) {
                ips.push(record.replace('ip4:', ''));
            }
            if (~record.indexOf('ip6:')) {
                ips.push(record.replace('ip6:', ''));
            }
        });
        return ips;
    }
}

module.exports = GCP;