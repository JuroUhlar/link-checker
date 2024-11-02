import { checkLink } from "./src/link";

(async () => {
  for (let i = 0; i < 50; i++) {
    console.log(
      await checkLink(
        "https://github.com/fingerprintjs/fingerprint-pro-server-api-java-sdk/blob/main/docs/FingerprintApi.md#webhookTrace",
        true
      )
    );
  }
})();
