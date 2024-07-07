import * as cheerio from "cheerio";
import { Link } from "./types";
import { USER_AGENT } from "./checkLink";

function filterLinks(links: Link[]): Link[] {
  const patternsToFilterOut = [
    // Starts with mailto:
    /^mailto:/,
    // Starts with https://apps.apple.com/ (gives 500 and redirects to native app store)
    /^https:\/\/apps\.apple\.com/,
    // https://portal.azure.com (Requires login)
    /^https:\/\/portal\.azure\.com/,
    // Included Cloudflare email link protection pattern like cdn-cgi/l/email-protection#1e6d6b6e6e716c6a5e787770797b6c6e6c77706a307d7173216d6b7c747b7d6a23573b2c2e697f706a3b2c2e6a713b2c2e757b7b6e3b2c2e544d3b2c2e5f797b706a3b2c2e7d717a7b3b2c2e71703b2c2e73673b2c2e6d7b6c687b6c
    /cdn-cgi\/l\/email\-protection/,
  ];
  return links.filter(
    (link) => !patternsToFilterOut.some((pattern) => pattern.test(link.href))
  );
}

export async function getPageLinks(url: string): Promise<Link[]> {
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
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
