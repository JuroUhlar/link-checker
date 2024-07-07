import * as cheerio from "cheerio";
import { chromium } from "playwright";
import { LinkCheckResult } from "./types";

export const OKAY_STATUS_CODES = [200, 301, 302, 303, 307, 308];
// Some sites (Segment docs for example) respond with 403 forbidden to simple fetch requests, must add a user agent to prevent this
export const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.142.86 Safari/537.36";

/**
 *
 * @param url link URL
 * @returns LinkCheckResult
 * @throws {Error} - network can fail or something
 */
export const checkLink = async (
  url: string,
  verbose = false
): Promise<LinkCheckResult> => {
  const hash = new URL(url).hash;
  const response = await fetch(url, {
    method: hash ? "GET" : "HEAD",
    redirect: "follow",
    headers: {
      "User-Agent": USER_AGENT,
    },
  });
  if (OKAY_STATUS_CODES.includes(response.status) === false) {
    if (verbose) {
      console.log("Responded with", response.status);
    }
    // return { ok: false, error: "broken link" };
    return await checkLinkWithPlaywright(url, verbose);
  }

  if (hash) {
    var $ = cheerio.load(await response.text());
    /**
     * GitHub readmes put the hash into the `href` attribute instead of `id`
     */
    var element = $(`${hash}, [href="${hash}"]`).first();
    if (element.length === 0) {
      // return { ok: false, error: "hash not found" };
      if (verbose) {
        console.log("Hash not found at first, checking with Playwright");
      }
      return await checkLinkWithPlaywright(url, verbose);
    }
  }
  if (verbose) {
    console.log("OK");
  }
  return { ok: true };
};

export async function checkLinkWithPlaywright(
  url: string,
  verbose = false
): Promise<LinkCheckResult> {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    userAgent: USER_AGENT,
  });
  const page = await context.newPage();

  try {
    // Navigate to the URL
    const response = await Promise.race([
      page.goto(url),
      page.waitForResponse(
        (response) => response.url() === url && response.status() > 99
      ),
    ]);
    if (verbose) {
      console.log(response?.status());
    }

    // Check if the current URL matches the given URL
    if (!response || !OKAY_STATUS_CODES.includes(response.status())) {
      return { ok: false, error: "broken link" };
    }

    const hash = new URL(url).hash.replace("#", "");
    if (hash) {
      // Check if the element with `id` of `href`  equal to hash is present
      await page.waitForLoadState("networkidle");
      const isHashElementPresent = await page
        .locator(`[id="${hash}"], [href="#${hash}"]`)
        .isVisible();
      if (!isHashElementPresent) {
        return { ok: false, error: "hash not found" };
      }
    }

    return { ok: true };
  } catch (error) {
    console.error("An error occurred:", error);
    return {
      ok: false,
      error: "broken link",
      errorDetail: error.toString(),
    };
  } finally {
    await browser.close();
  }
}
