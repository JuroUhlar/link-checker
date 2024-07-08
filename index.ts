import results from "./results/brokenLinks-fingerprint.com.json";
import { getReport } from "./src/report";
import { checkLinks } from "./src/link";

(async () => {
  const brokenLinks = results.brokenLinks.map((link) => ({
    ...link,
    result: undefined,
  }));
  const again = await checkLinks(brokenLinks, true);
  const report = getReport(again.results);
  console.log(report);
})();
