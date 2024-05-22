import { LinkCheckResult, checkLink } from "./checkLink";
import * as cheerio from "cheerio";
import { getPageLinks } from "./getPageLinks";
import { writeFileSync } from "fs";

const getPagesFromSitemap = async (sitemapUrl: string) => {
  const response = await (await fetch(sitemapUrl)).text();
  const $ = cheerio.load(response, { xmlMode: true });
  const pages: string[] = [];
  $("url").each((_, urlElem) => {
    const location = $(urlElem).find("loc").text();
    pages.push(location);
  });
  return pages;
};

const checkSitemap = async (url: string) => {
  const checkedLinks = new Map<
    string,
    { result: LinkCheckResult; backlinks: string[] }
  >();

  const pagesToCheck = await getPagesFromSitemap(url);
  await Promise.all(
    pagesToCheck.map(async (page) => {
      const linksToCheck = await getPageLinks(page);
      console.log(page);
      await Promise.all(
        linksToCheck.map(async (link) => {
          if (checkedLinks.has(link)) {
            // Already checked, just add the backlink
            const { result, backlinks } = checkedLinks.get(link)!;
            checkedLinks.set(link, { result, backlinks: [...backlinks, page] });
          } else {
            // New link, check it
            const result = await checkLink(link);
            console.log("       ", link, result.ok ? "✅" : "❌", result.error);
            checkedLinks.set(link, { result, backlinks: [page] });
          }
        })
      );
    })
  );

  const brokenLinks = [...checkedLinks.entries()]
    .filter(([_link, { result }]) => !result.ok)
    .map(([link, { result, backlinks }]) => ({
      link,
      result: !result.ok ? result.error : "ok",
      backlinks,
    }));

  const result = {
    totalLinks: checkedLinks.size,
    totalWorkingLinks: checkedLinks.size - brokenLinks.length,
    totalBrokenLinks: brokenLinks.length,
    brokenLinks,
  };

  // Write result to file
  writeFileSync(`./result.json`, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  return result;
};

(async () => {
  await checkSitemap("https://dev.fingerprint.com/sitemap.xml");
})();
