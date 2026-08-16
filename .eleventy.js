const { basePath } = require("./site/_lib/paths.js");

module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy({"site/assets": "assets"});
  eleventyConfig.addPassthroughCopy("case-evidence-ledger_timeline.html");
  return {
    dir: { input: "site", output: process.env.SITE_OUTPUT_DIR || "_site", data: "_data" },
    pathPrefix: basePath,
    htmlTemplateEngine: false,
    markdownTemplateEngine: false,
    templateFormats: ["11ty.js"]
  };
};
