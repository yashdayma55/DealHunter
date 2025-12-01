// src/services/db.ts
import { supabase } from "../supabaseClient.js";
// -------------------------
// UPDATE PACKAGE METADATA
// -------------------------
export async function updatePackageMetadata(packageId, metadata) {
    const { error } = await supabase
        .from("packages")
        .update({
        name: metadata.title ?? undefined,
        description: metadata.description ?? undefined,
        rating: metadata.rating ?? undefined,
        store_url: metadata.url ?? undefined,
        icon_url: metadata.icon ?? undefined,
        installs: metadata.installs ?? undefined,
        scraped_json: metadata.raw ?? undefined,
        updated_at: new Date().toISOString()
    })
        .eq("id", packageId);
    if (error) {
        console.error(`Failed to update package metadata for id=${packageId}`, error);
    }
}
// -------------------------
// DATA SOURCE HELPERS
// -------------------------
export async function getOrCreateDataSource(name, baseUrl) {
    const { data, error } = await supabase
        .from("data_sources")
        .select("*")
        .eq("name", name)
        .maybeSingle();
    if (error)
        throw error;
    if (data)
        return data.id;
    const { data: inserted, error: insertErr } = await supabase
        .from("data_sources")
        .insert({ name, base_url: baseUrl })
        .select()
        .single();
    if (insertErr)
        throw insertErr;
    return inserted.id;
}
// -------------------------
// CHANNEL HELPERS
// -------------------------
export async function getOrCreateChannel(dataSourceId, channelName, route) {
    const { data, error } = await supabase
        .from("channels")
        .select("*")
        .eq("channel_name", channelName)
        .maybeSingle();
    if (error)
        throw error;
    if (data)
        return data.id;
    const { data: inserted, error: insertErr } = await supabase
        .from("channels")
        .insert({
        data_source_id: dataSourceId,
        channel_name: channelName,
        base_route: route
    })
        .select()
        .single();
    if (insertErr)
        throw insertErr;
    return inserted.id;
}
// -------------------------
// CATEGORY HELPERS
// -------------------------
export async function getOrCreateCategory(name) {
    const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("name", name)
        .maybeSingle();
    if (error)
        throw error;
    if (data)
        return data.id;
    const { data: inserted, error: insertErr } = await supabase
        .from("categories")
        .insert({ name })
        .select()
        .single();
    if (insertErr)
        throw insertErr;
    return inserted.id;
}
// -------------------------
// PLATFORM HELPERS
// -------------------------
export async function getPlatformId(platform) {
    const { data, error } = await supabase
        .from("platforms")
        .select("*")
        .eq("name", platform)
        .maybeSingle();
    if (error)
        throw error;
    if (data)
        return data.id;
    const { data: inserted, error: insertErr } = await supabase
        .from("platforms")
        .insert({ name: platform })
        .select()
        .single();
    if (insertErr)
        throw insertErr;
    return inserted.id;
}
// -------------------------
// PACKAGE HELPERS
// -------------------------
export async function getOrCreatePackage(packageUid, name, categoryId, platformId, storeUrl) {
    const { data, error } = await supabase
        .from("packages")
        .select("*")
        .eq("package_uid", packageUid)
        .maybeSingle();
    if (error)
        throw error;
    if (data)
        return data.id;
    const { data: inserted, error: insertErr } = await supabase
        .from("packages")
        .insert({
        package_uid: packageUid,
        name,
        category_id: categoryId,
        platform_id: platformId,
        store_url: storeUrl
    })
        .select()
        .single();
    if (insertErr)
        throw insertErr;
    return inserted.id;
}
