import { checkLink, checkLinkWithPlaywright } from "./src/link";
import { parallelProcess } from "./src/utils";

(async () => {
  // for (let i = 0; i < 50; i++) {
  //   // console.log(await checkLink("https://docs.fingerprintjs.com/", true));
  //   console.log(await checkLink("https://dev.fingerprint.com/reference/javascript-agent#visitorid", true));
  // }

  parallelProcess(
    Array.from({ length: 10 }).map((_, i) => i),
    async (i) => {
      console.log(await checkLink("https://dev.fingerprint.com/reference/javascript-agent#visitorid", true));
      console.log(i);
    }
  );
})();
