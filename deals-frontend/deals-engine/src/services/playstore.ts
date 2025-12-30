// src/services/playstore.ts
import gplay from "google-play-scraper";

export interface PlayStoreMetadata {
  title: string | null;
  description: string | null;
  rating: number | null;
  installs: string | null;
  icon: string | null;
  genre: string | null;
  category: string | null;
  url: string | null;
  raw: any; // full original response
}

export async function fetchPlayStoreMetadata(
  pkgUid: string
): Promise<PlayStoreMetadata | null> {
  try {
    const app = await gplay.app({
      appId: pkgUid,
      country: "us",
      lang: "en",
    });

    return {
      title: app.title ?? null,
      description: app.description ?? null,
      rating: app.score ?? null,
      installs: app.installs ?? null,
      icon: app.icon ?? null,
      genre: app.genre ?? null,
      category: app.genre ?? null, // use genre as category for now
      url: app.url ?? null,
      raw: app,
    };
  } catch (err: any) {
    if (err?.status === 404) {
      console.log(`PlayStore: app not found for ${pkgUid} (404)`);
    } else {
      console.error(`PlayStore: error for ${pkgUid}`, err);
    }
    return null;
  }
}
