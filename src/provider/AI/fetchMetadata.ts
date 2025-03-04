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
 * fetchMetadataWithMetascraper
 *
 * Fetches the HTML of the given URL using Axios and extracts metadata using metascraper
 * with a set of plugins (title, description, image).
 *
 * @param url - The URL of the page to fetch.
 * @returns A promise that resolves to a Metadata object.
 */
export async function fetchMetadataWithMetascraper(url: string): Promise<Metadata> {
  console.log(`Fetching HTML via axios for metascraper from: ${url}`);
  // Fetch the HTML content using axios.
  const { data: html } = await axios.get(url);
  console.log(`Fetched HTML length: ${html.length}`);

  // Configure metascraper with the desired plugins.
  const scraper = metascraper([
    metascraperTitle(),
    metascraperDescription(),
    metascraperImage(),
    // Additional plugins can be added here.
  ]);

  console.log(`Running metascraper with plugins on URL: ${url}`);
  // Extract metadata by providing the HTML and URL.
  const meta = await scraper({ html, url });
  console.log('Metascraper raw output:', meta);

  // Map the metascraper output to our defined Metadata type.
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
 * fetchMetadataWithAxios
 *
 * Fetches the HTML of a page using Axios and manually extracts metadata using Cheerio.
 * This is suitable for static pages where the content is available in the HTML.
 *
 * @param url - The URL of the page to fetch.
 * @returns A promise that resolves to a Metadata object.
 */
export async function fetchMetadataWithAxios(url: string): Promise<Metadata> {
  console.log(`Fetching HTML via axios for Cheerio extraction from: ${url}`);
  // Retrieve the HTML content using axios.
  const response = await axios.get(url);
  const html = response.data;
  console.log(`Fetched HTML length: ${html.length}`);

  // Load the HTML into Cheerio for DOM manipulation.
  const $ = cheerio.load(html);

  // Extract title using Open Graph meta tag or the <title> element.
  const title = $("meta[property='og:title']").attr("content") || $("title").text().trim() || "";
  console.log('Extracted title:', title);
  
  // Extract description from standard meta or Open Graph meta tags.
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

  // Attempt to extract tags from JSON-LD scripts.
  $("script[type='application/ld+json']").each((i, script) => {
    try {
      const jsonData = JSON.parse($(script).html() || "{}");
      console.log(`JSON-LD data from script ${i}:`, jsonData);
      if (jsonData.keywords) {
        // Split keywords by commas, trim each, and merge with existing tags.
        tags = [
          ...new Set([
            ...tags,
            ...jsonData.keywords.split(",").map((t: string) => t.trim()),
          ]),
        ];
      } else if (jsonData.about) {
        // If 'about' field exists, handle both string and array formats.
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

  // Additionally, try to extract tags from the meta keywords tag.
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

  // Map the extracted values to our Metadata type.
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
 * fetchMetadataWithPuppeteer
 *
 * Uses Puppeteer to fetch metadata from pages that load content dynamically with JavaScript.
 * It launches a headless browser, navigates to the URL, waits for the page to load,
 * and then extracts metadata by evaluating page content.
 *
 * @param url - The URL of the page to fetch.
 * @returns A promise that resolves to a Metadata object.
 */
export async function fetchMetadataWithPuppeteer(url: string): Promise<Metadata> {
  console.log(`Launching Puppeteer for URL: ${url}`);
  // Launch a headless browser with specific flags for sandboxing.
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  // Set a realistic user agent to mimic a real browser.
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
  );

  console.log(`Navigating to ${url} with Puppeteer...`);
  // Navigate to the target URL and wait until network activity ceases.
  await page.goto(url, { waitUntil: "networkidle2" });
  // Optional delay to ensure dynamic content loads fully.
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Evaluate the page content to extract metadata.
  const metadata: Metadata = await page.evaluate(() => {
    // Helper function to get the content attribute from a meta tag.
    const getMeta = (selector: string): string =>
      document.querySelector(selector)?.getAttribute("content") || "";

    // Extract the title from meta tags or the <title> element.
    const title =
      getMeta("meta[property='og:title']") ||
      document.querySelector("title")?.innerText ||
      "";
    // Extract the description from meta tags.
    const description =
      getMeta("meta[name='description']") ||
      getMeta("meta[property='og:description']") ||
      "";
    // Extract the image URL from meta tags.
    const imageUrl = getMeta("meta[property='og:image']") || "";

    let tags: string[] = [];
    // Example: for Behance pages, extract tags from elements.
    const behanceTags = document.querySelectorAll(".ProjectTags-link");
    if (behanceTags.length > 0) {
      tags = Array.from(behanceTags)
        .map((el) => el.textContent?.trim() || "")
        .filter(Boolean);
    }

    // Also try to extract tags from the meta keywords tag.
    const metaKeywords = getMeta("meta[name='keywords']");
    if (metaKeywords) {
      tags = metaKeywords.split(",").map((tag) => tag.trim()).filter(Boolean);
    }

    let categories: string[] = [];
    // Extract category information from meta tags.
    const categoryMeta = getMeta("meta[property='article:section']");
    if (categoryMeta) {
      categories.push(categoryMeta);
    } else {
      // Fallback: extract category from breadcrumbs if available.
      const categoryEl = document.querySelector(".Breadcrumbs-listItem span");
      if (categoryEl && categoryEl.textContent) {
        categories.push(categoryEl.textContent.trim());
      }
    }

    return { title, description, imageUrl, tags, categories };
  });
  console.log('Extracted Metadata (Puppeteer):', metadata);

  // Close the Puppeteer browser to free resources.
  await browser.close();
  return metadata;
}

/**
 * determineFetchMethod
 *
 * Determines the optimal method to fetch a page's metadata by performing a quick Axios request.
 * It inspects the page content (e.g., title) to decide if the page is static or JS-heavy.
 * For pages with missing titles or those indicating dynamic content (like Behance, Pinterest, etc.),
 * it returns "puppeteer" to use Puppeteer for rendering. Otherwise, it opts for Axios.
 *
 * @param url - The URL of the page.
 * @returns A promise that resolves to either "axios" or "puppeteer".
 */
export async function determineFetchMethod(url: string): Promise<"axios" | "puppeteer"> {
  console.log(`Determining fetch method for URL: ${url}`);
  try {
    // Perform a quick fetch using Axios with a timeout.
    const response = await axios.get(url, { timeout: 5000 });
    const html = response.data;
    console.log(`Quick axios fetch succeeded, HTML length: ${html.length}`);
    // Load the HTML into Cheerio for parsing.
    const $ = cheerio.load(html);

    // Extract the title from meta tags or the <title> element.
    const title = $("meta[property='og:title']").attr("content") || $("title").text().trim() || "";
    console.log(`Extracted title for method determination: "${title}"`);

    // If no title is found or if the title suggests the site is JS-heavy, use Puppeteer.
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