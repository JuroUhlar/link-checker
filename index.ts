import { checkLink } from "./src/link";

(async () => {
  console.log(
    await checkLink(
      "https://github.com/fingerprintjs/fingerprintjs-pro-use-cases/blob/0589bdd38ba636c897b11fff8d9d9992417b763f/src/server/checks.ts#L186",
      true
    )
  );
})();
