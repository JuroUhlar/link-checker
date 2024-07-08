import { LinkWithResult } from "./types";

export const getReport = (links: LinkWithResult[]) => {
  const brokenLinks = links.filter(
    (link) => link.result.ok === false && link.result.error === "broken link"
  );
  const hashNotFound = links.filter(
    (link) => link.result.ok === false && link.result.error === "hash not found"
  );
  const networkErrors = links.filter(
    (link) => link.result.ok === false && link.result.error === "network error"
  );

  return {
    summary: {
      totalLinksToFix:
        brokenLinks.length + hashNotFound.length + networkErrors.length,
      brokenLinks: brokenLinks.length,
      hashNotFound: hashNotFound.length,
      networkErrors: networkErrors.length,
    },
    brokenLinks,
    hashNotFound,
    networkErrors,
  };
};
