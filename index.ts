import results from "./results/brokenLinks-fingerprint.com.json";
import { getReport } from "./src/report";
import { checkLink, checkLinkWithPlaywright, checkLinks } from "./src/link";
import { checkWebsite } from "./src/website";

const checkDocsLinksFromFingerprintWebsite = async () => {
  await checkWebsite({
    websiteUrl: "https://fingerprint.com",
    linkFilter: (link) => link.href.startsWith("https://dev.fingerprint.com"),
  });
};

(async () => {
  // checkDocsLinksFromFingerprintWebsite();

  checkWebsite({
    websiteUrl: "https://fingerprint.com",
  });

  // const brokenLinks = results.brokenLinks.map((link) => ({
  //   ...link,
  //   result: undefined,
  // }));
  // const again = await checkLinks(brokenLinks, true);
  // const report = getReport(again.results, again.errors);
  // console.table(report.summary);
  // console.log(
  //   await checkLink(
  //     "https://datadome.co/learning-center/fight-content-theft/",
  //     true
  //   )
  // );
})();
