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
      href: `https://github.com/fingerprintjs/fingerprintjs-pro-use-cases/blob/0589bdd38ba636c897b11fff8d9d9992417b763f/src/server/checks.ts#L186`,
    })),
    verbose: true,
  });

  console.log(results.map((link) => link.result));
})();
