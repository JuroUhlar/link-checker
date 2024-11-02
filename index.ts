import { checkLink, checkLinkWithPlaywright } from "./src/link";

(async () => {
  // for (let i = 0; i < 50; i++) {
  // console.log(await checkLink("https://docs.fingerprintjs.com/", true));
  console.log(
    await checkLink(
      "hhttps://dev.fingerprint.com/docs/migrating-from-fingerprintjs-to-fingerprint-pro#migrating-from-fingerprintjs-v4-source-available-to-pr",
      true
    )
  );
  // }
})();
