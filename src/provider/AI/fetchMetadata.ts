import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

// Import metascraper and its plugins for metadata extraction.
import metascraper from 'metascraper';
import metascraperTitle from 'metascraper-title';
import metascraperDescription from 'metascraper-description';
import metascraperImage from 'metascraper-image';

// Define the Metadata type that holds the fetched information.
export type Metadata = {
  title: string;
  description: string;
  imageUrl: string;
  categories: string[];
  tags: string[];
};

/**
 * Attempts to fetch the page using metascraper.
 *
 * This function fetches the HTML with Axios and then uses metascraper
 * with a set of plugins to extract key metadata (title, description, image).
 * 
 * @param url - The URL of the page to fetch.
 * @returns A promise that resolves to a Metadata object.
 */
export async function fetchMetadataWithMetascraper(url: string): Promise<Metadata> {
  console.log(`Fetching HTML via axios for metascraper from: ${url}`);
  const { data: html } = await axios.get(url);
  console.log(`Fetched HTML length: ${html.length}`);

  // Configure metascraper with the desired plugins.
  const scraper = metascraper([
    metascraperTitle(),
    metascraperDescription(),
    metascraperImage(),
    // Add more plugins if needed.
  ]);

  console.log(`Running metascraper with plugins on URL: ${url}`);
  // Use the scraper instance to extract metadata by passing an object with 'html' and 'url'.
  const meta = await scraper({ html, url });
  console.log('Metascraper raw output:', meta);

  // Map the metascraper result to our Metadata type.
  const result: Metadata = {
    title: meta.title || '',
    description: meta.description || '',
    imageUrl: meta.image || '',
    tags: [],        // metascraper doesn't extract tags by default.
    categories: [],  // metascraper doesn't extract categories by default.
  };
  console.log('Mapped Metadata (metascraper):', result);
  return result;
}

/**
 * Attempts to fetch the page using Axios and Cheerio.
 *
 * This function is best for pages where content is static and available in the HTML.
 * It performs manual extraction of metadata such as title, description, image URL, and tags.
 *
 * @param url - The URL of the page to fetch.
 * @returns A promise that resolves to a Metadata object.
 */
export async function fetchMetadataWithAxios(url: string): Promise<Metadata> {
  console.log(`Fetching HTML via axios for Cheerio extraction from: ${url}`);
  const response = await axios.get(url);
  const html = response.data;
  console.log(`Fetched HTML length: ${html.length}`);

  // Load the HTML into Cheerio for easy querying.
  const $ = cheerio.load(html);

  // Extract the title using Open Graph meta tag or the <title> element.
  const title = $("meta[property='og:title']").attr("content") || $("title").text().trim() || "";
  console.log('Extracted title:', title);
  
  // Extract the description from various meta tags.
  const description =
    $("meta[name='description']").attr("content") ||
    $("meta[property='og:description']").attr("content") ||
    "";
  console.log('Extracted description:', description);
  
  // Extract the image URL from the Open Graph meta tag.
  const imageUrl = $("meta[property='og:image']").attr("content") || "";
  console.log('Extracted imageUrl:', imageUrl);

  // Initialize empty arrays for tags and categories.
  let tags: string[] = [];
  let categories: string[] = [];

  // Extract tags from JSON-LD scripts if available.
  $("script[type='application/ld+json']").each((i, script) => {
    try {
      const jsonData = JSON.parse($(script).html() || "{}");
      console.log(`JSON-LD data from script ${i}:`, jsonData);
      if (jsonData.keywords) {
        tags = [
          ...new Set([
            ...tags,
            ...jsonData.keywords.split(",").map((t: string) => t.trim()),
          ]),
        ];
      } else if (jsonData.about) {
        if (typeof jsonData.about === "string") {
          tags.push(jsonData.about);
        } else if (Array.isArray(jsonData.about)) {
          jsonData.about.forEach((item: any) => {
            if (item.name) tags.push(item.name);
          });
        }
      }
    } catch (error) {
      console.error("Error parsing JSON-LD:", error);
    }
  });

  // Extract additional tags from the meta keywords tag if available.
  const metaKeywords = $("meta[name='keywords']").attr("content");
  if (metaKeywords) {
    tags = [
      ...new Set([
        ...tags,
        ...metaKeywords.split(",").map((tag) => tag.trim()),
      ]),
    ];
  }
  console.log('Extracted tags:', tags);

  const result: Metadata = {
    title,
    description,
    imageUrl,
    tags: [...new Set(tags)],
    categories: [...new Set(categories)],
  };
  console.log('Mapped Metadata (Cheerio):', result);
  return result;
}

/**
 * Uses Puppeteer to fetch metadata from pages that load content dynamically.
 *
 * Puppeteer is used for sites that rely on JavaScript to render content.
 * It launches a headless browser, navigates to the URL, and extracts metadata.
 *
 * @param url - The URL of the page to fetch.
 * @returns A promise that resolves to a Metadata object.
 */
export async function fetchMetadataWithPuppeteer(url: string): Promise<Metadata> {
  console.log(`Launching Puppeteer for URL: ${url}`);
  // Launch Puppeteer with arguments for environments like Heroku.
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  // Set a user agent to mimic a real browser.
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
  );

  console.log(`Navigating to ${url} with Puppeteer...`);
  // Navigate to the target URL and wait until network activity ceases.
  await page.goto(url, { waitUntil: "networkidle2" });
  // Optional: Additional wait time to ensure dynamic content loads.
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Evaluate the page's content in the browser context.
  const metadata: Metadata = await page.evaluate(() => {
    // Helper function to get the content attribute of a meta tag.
    const getMeta = (selector: string): string =>
      document.querySelector(selector)?.getAttribute("content") || "";

    const title =
      getMeta("meta[property='og:title']") ||
      document.querySelector("title")?.innerText ||
      "";
    const description =
      getMeta("meta[name='description']") ||
      getMeta("meta[property='og:description']") ||
      "";
    const imageUrl = getMeta("meta[property='og:image']") || "";

    let tags: string[] = [];
    // Example: extract tags specific to Behance pages.
    const behanceTags = document.querySelectorAll(".ProjectTags-link");
    if (behanceTags.length > 0) {
      tags = Array.from(behanceTags)
        .map((el) => el.textContent?.trim() || "")
        .filter(Boolean);
    }

    // Attempt to extract tags from meta keywords.
    const metaKeywords = getMeta("meta[name='keywords']");
    if (metaKeywords) {
      tags = metaKeywords.split(",").map((tag) => tag.trim()).filter(Boolean);
    }

    let categories: string[] = [];
    // Extract categories from meta tags (e.g., article section).
    const categoryMeta = getMeta("meta[property='article:section']");
    if (categoryMeta) {
      categories.push(categoryMeta);
    } else {
      // Fallback: try to extract categories from a breadcrumbs element.
      const categoryEl = document.querySelector(".Breadcrumbs-listItem span");
      if (categoryEl && categoryEl.textContent) {
        categories.push(categoryEl.textContent.trim());
      }
    }

    return { title, description, imageUrl, tags, categories };
  });
  console.log('Extracted Metadata (Puppeteer):', metadata);

  // Close the browser to free up resources.
  await browser.close();
  return metadata;
}

/**
 * Determines which fetching method to use based on the URL's characteristics.
 *
 * This function performs a quick Axios request to inspect the page content.
 * If the title is missing or the content suggests the page is JS-heavy (e.g., Behance, Pinterest, Instagram, etc.),
 * it returns "puppeteer" so that Puppeteer is used for rendering dynamic content.
 * Otherwise, it opts for Axios (and you can choose to process with metascraper).
 *
 * @param url - The URL of the page.
 * @returns A promise that resolves to either "axios" or "puppeteer".
 */
export async function determineFetchMethod(url: string): Promise<"axios" | "puppeteer"> {
  console.log(`Determining fetch method for URL: ${url}`);
  try {
    // Try a quick fetch with Axios.
    const response = await axios.get(url, { timeout: 5000 });
    const html = response.data;
    console.log(`Quick axios fetch succeeded, HTML length: ${html.length}`);
    const $ = cheerio.load(html);

    const title = $("meta[property='og:title']").attr("content") || $("title").text().trim() || "";
    console.log(`Extracted title for method determination: "${title}"`);

    // If no title is found or the title suggests a JS-heavy page, use Puppeteer.
    if (!title || /Behance|Pinterest|Instagram|Twitter|Medium/i.test(title)) {
      console.log(`Detected JS-heavy site, using Puppeteer for: ${url}`);
      return "puppeteer";
    }
    console.log(`Using axios for URL: ${url}`);
    return "axios";
  } catch (error) {
    console.error("Axios fetch failed, defaulting to Puppeteer:", error);
    return "puppeteer";
  }
}