import { checkLink } from "./checkLink";

const linksToCheck = [
  "https://dev.fingerprint.com/docs/quick-start-guide",
  "https://dev.fingerprint.com/docs/does-not-exist",
  "https://dev.fingerprint.com/docs/quick-start-guide#hash-does-not-exist",
  "https://dev.fingerprint.com/docs/quick-start-guide#get-your-api-key",
];

async function main() {
  for (const link of linksToCheck) {
    const result = await checkLink(link);
    console.log(
      `${link}: ${result.ok ? "✅" : "❌"} ${!result.ok ? result.error : ""}`
    );
  }
}
main();
