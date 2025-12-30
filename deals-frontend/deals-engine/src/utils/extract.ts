export function extractPackageId(url: string): string | null {
  try {
    if (!url.includes("play.google.com")) return null;

    const parsed = new URL(url);
    const pkg = parsed.searchParams.get("id");

    return pkg ? pkg.trim() : null;
  } catch (err) {
    return null;
  }
}
