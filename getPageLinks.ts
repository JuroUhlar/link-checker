import * as cheerio from "cheerio";

export async function getPageLinks(url: string): Promise<string[]> {
  const response = await fetch(url);
  if (!response.ok) {
    return [];
  }

  const $ = cheerio.load(await response.text(), { baseURI: url });
  const links = $("a");

  const result: string[] = [];
  links.each((index, value) => {
    const href = value.attribs.href;
    if (href) {
      if (href.startsWith("http")) {
        result.push(href);
      } else {
        result.push(new URL(href, url).href);
      }
    }
  });

  return result;
}
