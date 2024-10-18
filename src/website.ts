import { getLinksFromPages, parseLinksFromPage } from "./page";
import { writeFileSync } from "fs";

import { checkLinks } from "./link";
import { getReport } from "./report";
import { getWebsitePages } from "./sitemap";
import { Link } from "./types";

type CheckWebsiteArgs = {
  websiteUrl: string;
  linkFilter?: (link: Link) => boolean;
};

export const checkWebsite = async ({
  websiteUrl,
  linkFilter,
}: CheckWebsiteArgs) => {
  const startTime = performance.now();

  const pages = await getWebsitePages(websiteUrl, true);
  const { links } = await getLinksFromPages({ pages, linkFilter });
  const { results, errors } = await checkLinks(links);
  const report = getReport(results, errors);
  console.log(report.summary);

  const hostname = new URL(websiteUrl).hostname;
  const filename = `./results/brokenLinks-${hostname}.json`;
  writeFileSync(filename, JSON.stringify(report, null, 2));
  console.log(`Saved report to ${filename}`);
  console.log(`Finished in ${(performance.now() - startTime) / 1000} seconds.`);
};
