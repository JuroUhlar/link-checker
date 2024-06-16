import * as cheerio from "cheerio";

type Link = {
  href: string;
  text: string;
};

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
        result.push({ href, text: $(value).text() });
      } else {
        result.push({ href: new URL(href, url).href, text: $(value).text() });
      }
    }
  });

  return result;
}
