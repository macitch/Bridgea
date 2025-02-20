import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import { categorizeWithGemini } from '@/utils/categorizeWithAI';

type Metadata = {
  title: string;
  description: string;
  imageUrl: string;
  categories: string[];
  tags: string[];
};

// Loader to prevent multiple simultaneous requests
const processingRequests = new Set<string>();

/**
 * Attempts to fetch the page with Axios and Cheerio.
 */
async function fetchMetadataWithAxios(url: string): Promise<Metadata> {
  const response = await axios.get(url);
  const html = response.data;
  const $ = cheerio.load(html);

  const title = $("meta[property='og:title']").attr("content") || $("title").text().trim() || "";
  const description = $("meta[name='description']").attr("content") || $("meta[property='og:description']").attr("content") || "";
  const imageUrl = $("meta[property='og:image']").attr("content") || "";

  let tags: string[] = [];
  let categories: string[] = [];

  // Extract tags from JSON-LD (check for keywords)
  $("script[type='application/ld+json']").each((i, script) => {
    try {
      const jsonData = JSON.parse($(script).html() || "{}");
      if (jsonData.keywords) {
        tags = [...new Set([...tags, ...jsonData.keywords.split(",").map((t: string) => t.trim())])];
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

  // Extract meta keywords if available
  const metaKeywords = $("meta[name='keywords']").attr("content");
  if (metaKeywords) {
    tags = [...new Set([...tags, ...metaKeywords.split(",").map((tag) => tag.trim())])];
  }

  return { title, description, imageUrl, tags: [...new Set(tags)], categories: [...new Set(categories)] };
}

/**
 * Uses Puppeteer to fetch metadata from pages that load content dynamically.
 */
async function fetchMetadataWithPuppeteer(url: string): Promise<Metadata> {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
  );

  await page.goto(url, { waitUntil: "networkidle2" });
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const metadata: Metadata = await page.evaluate(() => {
    const getMeta = (selector: string): string =>
      document.querySelector(selector)?.getAttribute("content") || "";

    const title = getMeta("meta[property='og:title']") || document.querySelector("title")?.innerText || "";
    const description = getMeta("meta[name='description']") || getMeta("meta[property='og:description']") || "";
    const imageUrl = getMeta("meta[property='og:image']") || "";

    let tags: string[] = [];
    const behanceTags = document.querySelectorAll(".ProjectTags-link"); // Behance tags
    if (behanceTags.length > 0) {
      tags = Array.from(behanceTags).map((el) => el.textContent?.trim() || "").filter(Boolean);
    }

    // Extract tags from other sources like meta or JSON
    const metaKeywords = getMeta("meta[name='keywords']");
    if (metaKeywords) {
      tags = metaKeywords.split(",").map((tag) => tag.trim()).filter(Boolean);
    }

    // Extract categories if available
    let categories: string[] = [];
    const categoryMeta = getMeta("meta[property='article:section']");
    if (categoryMeta) {
      categories.push(categoryMeta);
    } else {
      const categoryEl = document.querySelector(".Breadcrumbs-listItem span");
      if (categoryEl && categoryEl.textContent) {
        categories.push(categoryEl.textContent.trim());
      }
    }

    return { title, description, imageUrl, tags, categories };
  });

  await browser.close();
  return metadata;
}

/**
 * Determines which fetch method to use.
 */
async function determineFetchMethod(url: string): Promise<"axios" | "puppeteer"> {
  try {
    const response = await axios.get(url, { timeout: 5000 });
    const html = response.data;
    const $ = cheerio.load(html);

    const title = $("meta[property='og:title']").attr("content") || $("title").text().trim() || "";

    if (!title || /Behance|Pinterest|Instagram|Twitter|Medium/i.test(title)) {
      console.log(`Detected JS-heavy site, using Puppeteer for: ${url}`);
      return "puppeteer";
    }

    return "axios";
  } catch (error) {
    console.error("Axios fetch failed, using Puppeteer:", error);
    return "puppeteer";
  }
}

/**
 * API route handler with a loader to prevent interruptions.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  // Prevent duplicate requests
  if (processingRequests.has(url)) {
    return res.status(429).json({ error: 'Request already in progress. Please wait.' });
  }

  processingRequests.add(url);

  try {
    const method = await determineFetchMethod(url);
    let metadata: Metadata;

    if (method === 'axios') {
      metadata = await fetchMetadataWithAxios(url);
    } else {
      metadata = await fetchMetadataWithPuppeteer(url);
    }

    // 🔥 AI-based categorization
    metadata.categories = await categorizeWithGemini(metadata);

    res.status(200).json(metadata);
  } catch (error) {
    console.error('Error fetching metadata:', error);
    res.status(500).json({ error: 'Failed to fetch metadata' });
  } finally {
    processingRequests.delete(url); 
  }
}