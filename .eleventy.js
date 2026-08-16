module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy({"site/assets": "assets"});
  eleventyConfig.addPassthroughCopy("case-evidence-ledger_timeline.html");
  return {
    dir: { input: "site", output: "_site", data: "_data" },
    htmlTemplateEngine: false,
    markdownTemplateEngine: false,
    templateFormats: ["11ty.js"]
  };
};
