import { checkLink } from "./checkLink";
import { crawlSite } from "./crawlSite";
import { getPageLinks } from "./getPageLinks";

const linksToCheck = [
  "https://dev.fingerprint.com/docs/quick-start-guide",
  "https://dev.fingerprint.com/docs/does-not-exist",
  "https://dev.fingerprint.com/docs/quick-start-guide#hash-does-not-exist",
  "https://dev.fingerprint.com/docs/quick-start-guide#get-your-api-key",
];

async function main() {
  crawlSite("https://dev.fingerprint.com");
}

main();
