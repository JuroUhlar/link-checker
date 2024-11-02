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

  const { results } = await checkLinks({
    links: Array.from({ length: 15 }).map((_, i) => ({
      page: "test",
      text: "test",
      href: `https://dev.fingerprint.com/reference/javascript-agent#visitorid`,
    })),
    verbose: true,
  });

  console.log(results.map((link) => link.result));
})();
