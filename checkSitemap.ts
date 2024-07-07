import { checkLink, checkLinkWithPlaywright } from "./checkLink";
import * as cheerio from "cheerio";
import { getPageLinks } from "./getPageLinks";
import { writeFileSync } from "fs";
import { PromisePool } from "@supercharge/promise-pool";
import * as cliProgress from "cli-progress";
import { Link, LinkCheckResult, LinkWithResult } from "./types";

const CONCURRENCY_LIMIT = 30;
const progressBar = new cliProgress.SingleBar({});

const getPagesFromSitemap = async (sitemapUrl: string, verbose = false) => {
  const response = await (await fetch(sitemapUrl)).text();
  const $ = cheerio.load(response, { xmlMode: true });
  const pages: string[] = [];
  $("url").each((_, urlElem) => {
    const location = $(urlElem).find("loc").text();
    pages.push(location);
  });

  console.log(`Retrieved ${pages.length} pages from ${sitemapUrl} sitemap:`);
  if (verbose) {
    console.log(pages);
  }

  return pages;
};

const getLinksFromPages = async (pages: string[], verbose = false) => {
  progressBar.start(pages.length, 0);
  const { results, errors } = await PromisePool.withConcurrency(
    CONCURRENCY_LIMIT
  )
    .for(pages)
    .process(async (page) => {
      progressBar.increment();
      return getPageLinks(page);
    });
  progressBar.stop;
  const links = results.flat();
  console.log(
    `\nRetrieved ${links.length} links from ${results.length} pages.`
  );
  if (errors.length > 0) {
    console.log(`Retrieving links failed for ${errors.length} pages.`);
  }
  if (verbose) {
    console.log(errors);
  }
  return { links, errors };
};

const checkLinks = async (links: Link[], verbose = false) => {
  const resultMap = new Map<string, LinkCheckResult>();
  progressBar.start(links.length, 0);
  const { results, errors } = await PromisePool.withConcurrency(
    CONCURRENCY_LIMIT
  )
    .for(links)
    .process(async (link, index, pool): Promise<LinkWithResult> => {
      const existingResult = resultMap.get(link.href);
      let result: LinkCheckResult;
      if (existingResult) {
        // Already checked, just use the result
        link.result = existingResult;
      } else {
        // New link, check it
        const newResult = await checkLink(link.href);
        resultMap.set(link.href, newResult);
        link.result = newResult;
      }
      progressBar.increment();
      return link as LinkWithResult;
    });
  progressBar.stop();

  console.log(`Checked ${results.length} links.`);
  console.log(`Unexpected errors ocurred for ${errors.length} links`);
  if (verbose) {
    console.log(errors);
  }
  return { results, errors };
};

const getReport = (links: LinkWithResult[]) => {
  const brokenLinks = links.filter(
    (link) => link.result.ok === false && link.result.error === "broken link"
  );
  const hashNotFound = links.filter(
    (link) => link.result.ok === false && link.result.error === "hash not found"
  );
  const networkErrors = links.filter(
    (link) => link.result.ok === false && link.result.error === "network error"
  );

  return {
    summary: {
      totalLinksToFix:
        brokenLinks.length + hashNotFound.length + networkErrors.length,
      brokenLinks: brokenLinks.length,
      hashNotFound: hashNotFound.length,
      networkErrors: networkErrors.length,
    },
    brokenLinks,
    hashNotFound,
    networkErrors,
  };
};

const checkSitemap = async (sitemapUrl: string) => {
  const startTime = performance.now();

  const pages = await getPagesFromSitemap(sitemapUrl);
  const { links } = await getLinksFromPages(pages);
  const { results } = await checkLinks(links);
  const report = getReport(results);
  console.log(report.summary);

  writeFileSync(`./brokenLinks.json`, JSON.stringify(report, null, 2));
  console.log(`Finished in ${(performance.now() - startTime) / 1000} seconds.`);
};

(async () => {
  await checkSitemap("https://dev.fingerprint.com/sitemap.xml");
  // console.log(
  //   await checkLink(
  //     "https://developer.apple.com/documentation/bundleresources/privacy_manifest_files/describing_use_of_required_reason_api#4278393",
  //     true
  //   )
  // );
  // console.log(
  //   await checkLink(
  //     "https://dev.fingerprint.com/docs/what-is-fingerprint#terms-and-concepts",
  //     true
  //   )
  // );
})();
