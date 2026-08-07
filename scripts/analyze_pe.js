function cleanAssetUrl(url) {
  if (!url) return null;
  return url
    .replace(/\\\\u0026/gi, '&')
    .replace(/\\u0026/gi, '&')
    .replace(/&amp;/gi, '&')
    .trim();
}

const badUrl = "https://fustation.s3.ap-southeast-1.amazonaws.com/exams/pe/mss301/cmsex6fva000004lan2cckccn/1785863765510_df34915ad4b8bc09_material.zip?X-Amz-Algorithm=AWS4-HMAC-SHA256\\u0026X-Amz-Content-Sha256=UNSIGNED-PAYLOAD\\u0026X-Amz-Credential=AKIA5NQSY4L37CWBE5OJ%2F20260807%2Fap-southeast-1%2Fs3%2Faws4_request\\u0026X-Amz-Date=20260807T073207Z\\u0026X-Amz-Expires=600\\u0026X-Amz-Signature=095f930de8e982064403a1065528e362bcfd0bb982b937bfc4883ce239e5df58\\u0026X-Amz-SignedHeaders=host\\u0026x-amz-checksum-mode=ENABLED\\u0026x-id=GetObject";

console.log("Original bad URL:", badUrl);
console.log("\nCleaned URL:", cleanAssetUrl(badUrl));

// Comprehensive test of extractPeFromDOM on example-PE-examset-3.html
function testExtractPeFromDOM(fullHtml) {
  if (!fullHtml) return null;

  const pdfMatch = fullHtml.match(/\/api\/exams\/pdf\?productId=([a-zA-Z0-9]+)/i);
  const h1Match = fullHtml.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  const isPePage = /PE|Thi\s*PE|Tả\i\s*Đề\s*thi/i.test(fullHtml) || !!pdfMatch;

  if (!isPePage && !pdfMatch && !h1Match) return null;

  const title = h1Match ? h1Match[1].trim() : 'PE Exam';
  const productId = pdfMatch ? pdfMatch[1] : 'pe_unknown';
  const pdfUrl = pdfMatch ? `/api/exams/pdf?productId=${productId}` : null;

  // 1. Match anchor tag containing "Tải Bộ Đáp án", "Đáp án", "ZIP", or "archive" icon
  let zipUrl = null;
  const dapanAnchorMatch = fullHtml.match(/<a[^>]*href=["']([^"']+)["'][^>]*>[\s\S]*?(?:Tải Bộ Đáp án|Bộ Đáp án|Đáp án|\.zip|lucide-archive)[\s\S]*?<\/a>/i);
  if (dapanAnchorMatch && dapanAnchorMatch[1] && !dapanAnchorMatch[1].includes('/api/exams/pdf')) {
    zipUrl = dapanAnchorMatch[1].replace(/&amp;/g, '&');
  }

  // 2. Match href containing .zip or material
  if (!zipUrl) {
    const zipMatch = fullHtml.match(/href=["']([^"']*(?:\.zip|material\.zip|_material)[^"']*)["']/i) ||
                     fullHtml.match(/href=["']([^"']*\.zip[^"']*)["']/i);
    if (zipMatch) zipUrl = zipMatch[1].replace(/&amp;/g, '&');
  }

  // 3. Fallback raw URL match
  if (!zipUrl) {
    const rawZipMatch = fullHtml.match(/https?:\/\/[^\s"'\>]+\.zip[^\s"'\>]*/i);
    if (rawZipMatch) zipUrl = rawZipMatch[0].replace(/&amp;/g, '&');
  }

  return {
    id: productId,
    title,
    pdfUrl,
    zipUrl
  };
}

const res = testExtractPeFromDOM(content);
console.log('\n--- EXTRACTED PE DATASET ---');
console.log(res);
