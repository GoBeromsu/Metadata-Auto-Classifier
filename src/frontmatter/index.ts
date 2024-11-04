/**
 * Processes a string by removing spaces except in wiki links
 * @param str String to process
 * @returns Processed string with spaces removed except in wiki links
 */
export const processString = (str: string): string => {
	return str.replace(/(\[\[.*?\]\])|([^\[\]]+)/g, (fullMatch, wikiLinkMatch, regularTextMatch) => {
		if (wikiLinkMatch) {
			return wikiLinkMatch;
		}
		return regularTextMatch.replace(/\s+/g, '');
	});
};
