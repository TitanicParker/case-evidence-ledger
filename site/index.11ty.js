const { withBase } = require("./_lib/paths.js");

module.exports = class {
  data() {
    return { permalink: "/" };
  }

  render() {
    const target = withBase("/evidence/");
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Case Evidence Ledger</title>
  <meta http-equiv="refresh" content="0; url=${target}">
  <link rel="canonical" href="${target}">
  <link rel="stylesheet" href="${withBase('/assets/styles.css')}">
</head>
<body>
  <main class="not-found">
    <p class="eyebrow">Case Evidence Ledger</p>
    <h1>Opening the Evidence Foundation</h1>
    <p><a href="${target}">Continue to the controlled Evidence Foundation →</a></p>
  </main>
  <script>location.replace(${JSON.stringify(target)});</script>
</body>
</html>`;
  }
};
