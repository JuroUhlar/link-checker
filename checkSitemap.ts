import { LinkCheckResult, checkLink } from "./checkLink";
import * as cheerio from "cheerio";
import { Link, getPageLinks } from "./getPageLinks";
import { writeFileSync } from "fs";
import { PromisePool } from "@supercharge/promise-pool";
import * as cliProgress from "cli-progress";

const CONCURRENCY_LIMIT = 30;

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

const checkSitemap = async (sitemapUrl: string) => {
  const startTime = performance.now();

  // Get pages from sitemap
  const pageURLsToCheck = await getPagesFromSitemap(sitemapUrl);
  console.log("Pages to check (from sitemap): ", pageURLsToCheck.length);

  // Get links from pages
  const { results: pagesLinks, errors: pageErrors } =
    await PromisePool.withConcurrency(CONCURRENCY_LIMIT)
      .for(pageURLsToCheck)
      .process(async (page) => getPageLinks(page));
  const linksToCheck = pagesLinks.flat();

  console.log("Links to check (from pages)", linksToCheck.length);
  console.log("Errors while getting links", pageErrors.length, pageErrors);

  // Check links
  const resultMap = new Map<string, LinkCheckResult>();
  const progressBar = new cliProgress.SingleBar({});
  progressBar.start(linksToCheck.length, 0);

  const { results, errors } = await PromisePool.withConcurrency(
    CONCURRENCY_LIMIT
  )
    .for(linksToCheck)
    .process(async (link, index, pool) => {
      if (resultMap.has(link.href)) {
        // Already checked, just use the result
        link.result = resultMap.get(link.href);
      } else {
        // New link, check it
        const result = await checkLink(link.href);
        link.result = result;
        resultMap.set(link.href, result);
      }
      progressBar.increment();
      return link;
    });

  progressBar.stop();

  console.log("Errors while checking links", errors.length, errors);
  console.log("Results", results.length);
  const brokenLinks = results.filter((link) => link.result?.ok === false);
  console.log("Broken links", brokenLinks.length);

  // Write result to file
  writeFileSync(`./brokenLinks.json`, JSON.stringify(brokenLinks, null, 2));
  console.log(
    `Checked ${results.length} links in ${
      (performance.now() - startTime) / 1000
    } seconds.`
  );
  return;
};

(async () => {
  await checkSitemap("https://dev.fingerprint.com/sitemap.xml");
})();
