import { Injectable, inject } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { Meta, MetaDefinition, Title } from "@angular/platform-browser";

export interface SeoData {
  /** Page title without the site suffix. Omit to use the site default title. */
  title?: string;
  description?: string;
  /** Path used for canonical/og:url, e.g. "/product/123". Query string is stripped. */
  path?: string;
  image?: string;
  type?: "website" | "product";
  noindex?: boolean;
}

export const SITE_URL = "https://dolphinnaturals.com";
export const SITE_NAME = "Dolphin Naturals";

const DEFAULT_TITLE =
  "Dolphin Naturals – Natural Groceries, Rice, Millets, Pulses & Oils Online";
const DEFAULT_DESCRIPTION =
  "Shop natural groceries online from Dolphin Naturals – traditional rice varieties, millets, pulses, cold-pressed oils and more, delivered to your door.";
const DEFAULT_IMAGE = `${SITE_URL}/assets/img/logo/dolphin-natural-logo-blue.png`;

@Injectable({ providedIn: "root" })
export class SeoService {
  private title = inject(Title);
  private meta = inject(Meta);
  private doc = inject(DOCUMENT);

  update(d: SeoData): void {
    const url = SITE_URL + (d.path ?? "/").split(/[?#]/)[0];
    const fullTitle = d.title ? `${d.title} | ${SITE_NAME}` : DEFAULT_TITLE;
    const description = d.description || DEFAULT_DESCRIPTION;
    const image = d.image || DEFAULT_IMAGE;

    this.title.setTitle(fullTitle);
    const tags: MetaDefinition[] = [
      { name: "description", content: description },
      { name: "robots", content: d.noindex ? "noindex, nofollow" : "index, follow" },
      { property: "og:type", content: d.type ?? "website" },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:title", content: fullTitle },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:image", content: image },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: fullTitle },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: image },
    ];
    tags.forEach((tag) => this.meta.updateTag(tag));

    this.setCanonical(url);
  }

  setJsonLd(id: string, data: object): void {
    this.removeJsonLd(id);
    const script = this.doc.createElement("script");
    script.id = id;
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(data);
    this.doc.head.appendChild(script);
  }

  removeJsonLd(id: string): void {
    this.doc.getElementById(id)?.remove();
  }

  private setCanonical(url: string): void {
    let link = this.doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement("link");
      link.rel = "canonical";
      this.doc.head.appendChild(link);
    }
    link.href = url;
  }
}
