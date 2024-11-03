import { checkLink, checkLinks, checkLinkWithPlaywright } from "./src/link";
import { parallelProcess } from "./src/utils";

(async () => {
  // for (let i = 0; i < 50; i++) {
  //   // console.log(await checkLink("https://docs.fingerprintjs.com/", true));
  //   console.log(await checkLink("https://dev.fingerprint.com/reference/javascript-agent#visitorid", true));
  // }

  // parallelProcess(
  //   Array.from({ length: 10 }).map((_, i) => i),
  //   async (i) => {
  //     console.log(await checkLink("https://dev.fingerprint.com/reference/javascript-agent#visitorid", true));
  //     console.log(i);
  //   }
  // );

  console.log(
    await checkLink(
      "https://github.com/chromium/chromium/blob/37aabeb397ff0238cb3549b785430dfbab08131a/extensions/common/constants.h#L103",
      true
    )
  );

  const { results } = await checkLinks({
    links: Array.from({ length: 1 }).map((_, i) => ({
      page: "test",
      text: "test",
      href: `https://github.com/chromium/chromium/blob/37aabeb397ff0238cb3549b785430dfbab08131a/extensions/common/constants.h#L103`,
    })),
    verbose: true,
  });

  console.log(results.map((link) => link.result));
})();
