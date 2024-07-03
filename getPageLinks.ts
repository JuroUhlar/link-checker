import * as cheerio from "cheerio";
import { Link } from "./types";

function filterLinks(links: Link[]): Link[] {
  return links.filter((link) => !link.href.startsWith("mailto:"));
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
