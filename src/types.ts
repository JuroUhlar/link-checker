export type Link = {
  page: string;
  href: string;
  text: string;
  result?: LinkCheckResult;
};

export type LinkWithResult = Link & { result: LinkCheckResult };

export type LinkCheckResult =
  | {
      ok: true;
      note?: string;
    }
  | {
      ok: false;
      error:
        | "broken link" // 404 or some other non-successful response code
        | "hash not found" // Link works but the anchor hash is not found on the page
        | "network error" // Fetch failed, server completely dead, wrong protocol, etc.
        | "could not check"; // Recaptcha or other anti-scraping measures returning 403, 401 or the link requires a login
      errorDetail?: string;
    };
