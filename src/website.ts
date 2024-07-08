import { getLinksFromPages, parseLinksFromPage } from "./page";
import { writeFileSync } from "fs";

import { checkLinks } from "./link";
import { getReport } from "./report";
import { getWebsitePages } from "./sitemap";

export const checkWebsite = async (websiteUrl: string) => {
  const startTime = performance.now();

  const pages = await getWebsitePages(websiteUrl);
  const { links } = await getLinksFromPages(pages);
  const { results, errors } = await checkLinks(links);
  console.log(errors);
  const report = getReport(results);
  console.log(report.summary);

  const hostname = new URL(websiteUrl).hostname;
  const filename = `../results/brokenLinks-${hostname}.json`;
  writeFileSync(filename, JSON.stringify(report, null, 2));
  console.log(`Saved report to ${filename}`);
  console.log(`Finished in ${(performance.now() - startTime) / 1000} seconds.`);
};
