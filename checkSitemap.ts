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

type HrefSummary = {
  result: LinkCheckResult;
  foundIn: { page: string; linkText: string }[];
};

const checkSitemap = async (url: string) => {
  const startTime = performance.now();
  const checkedLinks = new Map<string, HrefSummary>();

  const pagesToCheck = await getPagesFromSitemap(url);
  console.log("Pages to check (from sitemap): ", pagesToCheck.length);
  for (const [index, page] of pagesToCheck.entries()) {
    console.log(
      `Checking page ${page}, ${Math.round(
        ((index + 1) / pagesToCheck.length) * 100
      )}%`
    );
    const linksToCheck = await getPageLinks(page);

    await Promise.all(
      linksToCheck.map(async ({ href, text }) => {
        if (checkedLinks.has(href)) {
          // Already checked, just add the backlink
          const { result, foundIn } = checkedLinks.get(href)!;
          checkedLinks.set(href, {
            result,
            foundIn: [...foundIn, { page, linkText: text }],
          });
        } else {
          // New link, check it
          const result = await checkLink(href);
          // console.log(
          //   "       ",
          //   href,
          //   result.ok ? "✅" : "❌",
          //   !result.ok ? result.error : ""
          // );
          checkedLinks.set(href, {
            result,
            foundIn: [{ page, linkText: text }],
          });
        }
      })
    );
  }

  const brokenLinks = [...checkedLinks.entries()]
    .filter(([_link, { result }]) => !result.ok)
    .map(([link, { result, foundIn: backlinks }]) => ({
      link,
      result: !result.ok ? result.error : "ok",
      backlinks,
    }));

  const networkErrors = brokenLinks.filter(
    (link) => link.result === "network error"
  );

  const result = {
    totalLinks: checkedLinks.size,
    totalWorkingLinks: checkedLinks.size - brokenLinks.length,
    totalBrokenLinks: brokenLinks.length,
    networkErrors,
    brokenLinks,
  };

  // Write result to file
  writeFileSync(`./result.json`, JSON.stringify(result, null, 2));
  // console.log(JSON.stringify(result, null, 2));
  console.log(
    `Checked ${checkedLinks.size} links in ${
      (performance.now() - startTime) / 1000
    } seconds.`
  );
  return result;
};

(async () => {
  await checkSitemap("https://dev.fingerprint.com/sitemap.xml");
  // console.log(
  //   await checkLink(
  //     "https://remix.run/docs/en/v1/guides/constraints#browser-only-code-on-the-server"
  //   )
  // );
})();
