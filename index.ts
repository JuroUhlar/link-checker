import results from "./results/brokenLinks-dev.fingerprint.com.json";
import { getReport } from "./src/report";
import { checkLink, checkLinkWithPlaywright, checkLinks } from "./src/link";
import { checkWebsite } from "./src/website";

(async () => {
  //   const brokenLinks = results.hashNotFound.map((link) => ({
  //     ...link,
  //     result: undefined,
  //   }));
  //   const again = await checkLinks(brokenLinks, true);
  //   const report = getReport(again.results, again.errors);
  //   console.log(report);

  //   checkWebsite("https://fingerprint.com");
  console.log(
    await checkLinkWithPlaywright(
      "https://www.reuters.com/article/us-health-coronavirus-usa-fraud-idUSKCN251025",
      true
    )
  );
})();
