import { checkReadmeDocs } from "../src/readme";

(async () => {
  const report = await checkReadmeDocs("dev.fingerprint.com");
  console.log(JSON.stringify(report, null, 2));
  if (report.summary.totalLinksToFix > 0) {
    process.exit(1);
  }
})();

