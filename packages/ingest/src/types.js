/**
 * @typedef {Object} RawSignalInput
 * @property {string} externalId
 * @property {string} title
 * @property {string} [url]
 * @property {string | null} [description]
 * @property {Object} rawPayload
 * @property {Date} discoveredAt
 * @property {number} [rankPosition]
 * @property {number} [volumeEstimate]
 * @property {number} [engagementScore]
 */

/**
 * @typedef {Object} IngestAdapter
 * @property {string} sourceSlug
 * @property {(config?: object) => Promise<RawSignalInput[]>} fetch
 */

module.exports = {};
