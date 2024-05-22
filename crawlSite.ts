import { LinkCheckResult, checkLink } from "./checkLink";
import { getPageLinks } from "./getPageLinks";

export async function crawlSite(siteUrl: string) {
  const pagesToCheck = new Set<string>([siteUrl]);
  const checkedPages = new Set<string>();
  const checkedLinks = new Map<
    string,
    { result: LinkCheckResult; backlinks: string[] }
  >();

  const checkPage = async (url: string) => {
    console.log("📄 Checking: ", url);
    const linksToCheck = await getPageLinks(url);
    for (const link of linksToCheck) {
      if (checkedLinks.has(link)) {
        // Already checked, just add the backlink
        const { result, backlinks } = checkedLinks.get(link)!;
        checkedLinks.set(link, { result, backlinks: [...backlinks, url] });
      } else {
        // New link, check it
        const result = await checkLink(link);
        console.log(
          `${link}: ${result.ok ? "✅" : "❌"} ${
            !result.ok ? result.error : ""
          }`
        );
        checkedLinks.set(link, { result, backlinks: [url] });
        if (result.ok && link.includes(siteUrl)) {
          if (!checkedPages.has(link)) {
            pagesToCheck.add(link);
          }
        }
      }
    }
    pagesToCheck.delete(url);
    checkedPages.add(url);

    // console.log("📄 Finished checking: ", url);
  };

  while (pagesToCheck.size > 0) {
    console.log("📄 Pages to check: ", pagesToCheck.size);
    await checkPage(pagesToCheck.values().next().value);
  }

  console.log("✅ Checked pages: ", checkedPages.size);
  console.log("✅ Checked links: ", checkedLinks.size);
  console.log("❌🔗 Broken links: ");
  [...checkedLinks.entries()]
    .filter(([, { result }]) => !result.ok)
    .map(([link, { result, backlinks }]) => {
      // @ts-ignore
      console.log(link, result.error, backlinks);
    });
}
