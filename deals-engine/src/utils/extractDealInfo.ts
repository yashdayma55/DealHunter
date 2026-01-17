// src/utils/extractDealInfo.ts

export function extractDealInfo(title: string) {
  let appName = title;
  let discountType: string | null = null;
  let discountValue: number | null = null;
  let priceBefore: number | null = null;
  let priceAfter: number | null = null;
  let currency: string | null = "USD";

  // 1. Clean App Name
  appName = title
    .replace(/\[.*?\]/g, "") 
    .replace(/\(.*?\)/g, "") 
    .split(/[:|\-–]/)[0]     
    .trim();

  // 2. Free Check
  if (/free/i.test(title) || /100%\s?off/i.test(title)) {
    priceAfter = 0;
    discountType = "free";
    discountValue = 100;
  }

  // 3. Extract Prices
  // Matches $0.59, 1.04€, etc.
  const priceRegex = /([$€£₹¥])\s?(\d+\.\d+|\d+)/g;
  const prices: number[] = [];
  let match;
  
  while ((match = priceRegex.exec(title)) !== null) {
    const val = parseFloat(match[2]);
    if (!isNaN(val)) {
        prices.push(val);
        // Capture currency
        const sym = match[1];
        if (sym === "€") currency = "EUR";
        if (sym === "£") currency = "GBP";
        if (sym === "₹") currency = "INR";
    }
  }

  // 4. Assign Prices
  if (prices.length >= 2) {
    prices.sort((a, b) => b - a); // Sort High to Low
    priceBefore = prices[0];
    priceAfter = prices[1];
  } else if (prices.length === 1 && priceAfter !== 0) {
    priceAfter = prices[0];
  }

  // 5. Extract Percentage (Handle "80% off" inside brackets)
  const percentMatch = title.match(/(\d+)%\s?off|[-](\d+)%/i);
  if (percentMatch) {
    discountType = "percentage";
    discountValue = parseInt(percentMatch[1] || percentMatch[2], 10);
  }

  return { appName, discountType, discountValue, priceBefore, priceAfter, currency };
}