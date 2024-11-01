import MarkdownIt from "markdown-it";
import { URL } from "url";
import { Link } from "./types";
import { readFileSync } from "fs";

export class MarkdownLinkExtractor {
  private md: MarkdownIt;
  private baseUrl: string;
  private links: Link[];

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
    this.md = new MarkdownIt();
    this.links = [];
  }

  private normalizeUrl(href: string): string | null {
    if (!href) return null;

    // Handle anchor links
    if (href.startsWith("#")) {
      return `${this.baseUrl}${href}`;
    }

    try {
      // Check if the URL is already absolute
      const parsed = new URL(href, this.baseUrl);
      return parsed.toString();
    } catch (e) {
      // If URL parsing fails, try to handle it as a relative path
      try {
        return new URL(href, this.baseUrl).toString();
      } catch (e) {
        console.warn(`Failed to parse URL: ${href}`);
        return null;
      }
    }
  }

  public extractLinks(markdown: string, page: string): Link[] {
    const tokens = this.md.parse(markdown, {});
    this.links = [];

    const processToken = (token: any, parentToken?: any) => {
      // Handle inline links
      if (token.type === "link_open") {
        const href = token.attrs.find((attr: [string, string]) => attr[0] === "href")?.[1];

        // Find the link text by looking at the next token
        const textToken = parentToken.children[parentToken.children.findIndex((t: any) => t === token) + 1];

        if (href && textToken && textToken.type === "text") {
          const absoluteUrl = this.normalizeUrl(href);
          if (absoluteUrl) {
            this.links.push({
              page,
              href: absoluteUrl,
              text: textToken.content,
            });
          }
        }
      }

      // Process nested tokens
      if (token.children) {
        token.children.forEach((childToken: any) => processToken(childToken, token));
      }
    };

    tokens.forEach((token) => processToken(token));
    return this.links;
  }

  public extractLinksFromFiles(files: Array<{ content: string; path: string }>): Link[] {
    let allLinks: Link[] = [];

    files.forEach((file) => {
      const pageLinks = this.extractLinks(file.content, file.path);
      allLinks = allLinks.concat(pageLinks);
    });

    return allLinks;
  }
}

// Helper function for single file processing
export const extractLinksFromMarkdown = (markdown: string, baseUrl: string, page: string): Link[] => {
  const extractor = new MarkdownLinkExtractor(baseUrl);
  return extractor.extractLinks(markdown, page);
};

// Helper function for multiple files
export const extractLinksFromFiles = (files: Array<{ content: string; path: string }>, baseUrl: string): Link[] => {
  const extractor = new MarkdownLinkExtractor(baseUrl);
  return extractor.extractLinksFromFiles(files);
};

async function test() {
  const file = "./downloaded_md_files/terraform-aws-fingerprint-cloudfront-proxy-integration_README.md";
  const content = await readFileSync(file, "utf8");
  const baseUrl = "https://github.com/fingerprintjs/terraform-aws-fingerprint-cloudfront-proxy-integration";
  const page = "https://github.com/fingerprintjs/terraform-aws-fingerprint-cloudfront-proxy-integration/";
  const links = extractLinksFromMarkdown(content, baseUrl, page);
  console.log(links);
}

test();
