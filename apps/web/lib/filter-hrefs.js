/**
 * @param {Array<{ value: string, label: string }>} options
 * @param {Record<string, string>} filters
 * @param {string} param
 * @param {(filters: Record<string, string>, opts?: { page?: number }) => string} buildPath
 */
export function withFilterHrefs(options, filters, param, buildPath) {
  return options.map((option) => ({
    ...option,
    href: buildPath({ ...filters, [param]: option.value }),
  }));
}
