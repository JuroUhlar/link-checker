import * as cheerio from "cheerio";
import { Link } from "./types";

function filterLinks(links: Link[]): Link[] {
  const patternsToFilterOut = [
    // Starts with mailto:
    /^mailto:/,
    // Starts with https://apps.apple.com/ (gives 500 and redirects to native app store)
    /^https:\/\/apps\.apple\.com/,
    // https://portal.azure.com (Requires login)
    /^https:\/\/portal\.azure\.com/,
  ];
  return links.filter(
    (link) => !patternsToFilterOut.some((pattern) => pattern.test(link.href))
  );
}

export async function getPageLinks(url: string): Promise<Link[]> {
  const response = await fetch(url);
  if (!response.ok) {
    return [];
  }

  const $ = cheerio.load(await response.text(), { baseURI: url });
  const links = $("a");

  const result: Link[] = [];
  links.each((index, value) => {
    const href = value.attribs.href;
    if (href) {
      if (href.startsWith("http")) {
        result.push({ href, text: $(value).text(), page: url });
      } else {
        result.push({
          href: new URL(href, url).href,
          text: $(value).text(),
          page: url,
        });
      }
    }
  });

  return filterLinks(result);
}
