// src/scripts/backfillPackages.ts

import { supabase } from "../supabaseClient.js";
import { fetchPlayStoreMetadata } from "../services/playstore.js";
import { updatePackageMetadata } from "../services/db.js";

const BATCH_SIZE = 25;

/**
 * Fetch a batch of packages that need metadata.
 * Here we pick rows where scraped_json IS NULL.
 * You can tweak this condition later.
 */
async function fetchPendingPackages(offset: number) {
  const { data, error } = await supabase
    .from("packages")
    .select("id, package_uid")
    .is("scraped_json", null)
    .order("id", { ascending: true })
    .range(offset, offset + BATCH_SIZE - 1);

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function backfillPackages() {
  console.log("🚀 Starting Play Store metadata backfill for packages…");

  let offset = 0;
  let totalUpdated = 0;

  while (true) {
    const batch = await fetchPendingPackages(offset);

    if (batch.length === 0) {
      console.log("✅ No more packages to backfill. Done.");
      break;
    }

    console.log(
      `\n📦 Processing batch at offset ${offset} (size: ${batch.length})`
    );

    for (const pkg of batch) {
      const { id, package_uid } = pkg as { id: number; package_uid: string };

      try {
        console.log(`🔍 Fetching metadata for package_uid="${package_uid}"`);

        const metadata = await fetchPlayStoreMetadata(package_uid);

        if (!metadata) {
          console.warn(
            `⚠️  No metadata returned for package_uid="${package_uid}", skipping`
          );
          continue;
        }

        await updatePackageMetadata(id, metadata);
        totalUpdated++;

        console.log(`✅ Updated package id=${id} (${package_uid})`);
      } catch (err: any) {
        console.error(
          `❌ Failed to update package id=${id} (${package_uid}):`,
          err?.message ?? err
        );
      }
    }

    offset += batch.length;

    // Optional: small delay to be nice to Play Store
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\n🎉 Backfill complete. Total packages updated: ${totalUpdated}`);
}

// Run immediately when called via `node dist/scripts/backfillPackages.js`
backfillPackages().catch((err) => {
  console.error("💥 Backfill crashed:", err);
  process.exit(1);
});
