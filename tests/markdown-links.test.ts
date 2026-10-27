import { test, expect } from "vitest";
import { rewriteRelativeLinks } from "@/lib/markdown-links";

const R = { repo: "kingxxasavan/poly-os-7-debain-receration", ref: "main" };
const BLOB = "https://github.com/kingxxasavan/poly-os-7-debain-receration/blob/main";

test.each([
  ["[a](https://x.dev)", "[a](https://x.dev)"],
  ["[a](mailto:hi@x.dev)", "[a](mailto:hi@x.dev)"],
  ["[a](#install)", "[a](#install)"],
  ["[a](docs/README.md)", `[a](${BLOB}/docs/README.md)`],
  ["[a](./docs/README.md)", `[a](${BLOB}/docs/README.md)`],
  ["[a](/docs/README.md)", `[a](${BLOB}/docs/README.md)`],
  ["[a](docs/README.md#setup)", `[a](${BLOB}/docs/README.md#setup)`],
  ["[a](docs/)", "[a](https://github.com/kingxxasavan/poly-os-7-debain-receration/tree/main/docs/)"],
  ["![s](docs/x.png)", "![s](https://raw.githubusercontent.com/kingxxasavan/poly-os-7-debain-receration/main/docs/x.png)"],
  ["see [`docs/`](docs/) and [b](CREDITS.md)", `see [\`docs/\`](https://github.com/kingxxasavan/poly-os-7-debain-receration/tree/main/docs/) and [b](${BLOB}/CREDITS.md)`],
  ["```\n[a](docs/x)\n```", "```\n[a](docs/x)\n```"],
  ["`[a](docs/x)` stays", "`[a](docs/x)` stays"],
])("rewrites %j", (input, out) => {
  expect(rewriteRelativeLinks(input, R)).toBe(out);
});
