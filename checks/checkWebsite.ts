import { checkWebsite } from "../src/website";

// For now, only check links from fingerprint.com to Docs at dev.fingerprint.com
(async () => {
  await checkWebsite({
    websiteUrl: "https://fingerprint.com",
    linkFilter: (link) => link.href.startsWith("https://dev.fingerprint.com"),
  });
})();
