import * as cheerio from "cheerio";

type LinkCheckResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: "hash not found" | "broken link";
    };

export const checkLink = async (url: string): Promise<LinkCheckResult> => {
  const response = await fetch(url);
  const status = response.status;
  if (status >= 300) {
    return { ok: false, error: "broken link" };
  }
  const hash = new URL(url).hash;
  if (hash) {
    var $ = cheerio.load(await response.text());
    var element = $(hash);
    if (element.length === 0) {
      return { ok: false, error: "hash not found" };
    }
  }
  return { ok: true };
};
