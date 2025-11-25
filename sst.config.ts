/// <reference path="./.sst/platform/config.d.ts" />
import * as fs from "node:fs";
import path = require("node:path");

export default $config({
  app(input) {
    return {
      name: "monorepo-template",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
    const storage = await import("./infra/storage");

    const outputs = {};

    const {readdirSync} = await import("node:fs");

    for (const value of readdirSync("./infra/")) {
      console.log({ value });

      const result = await import("./infra/" + value);

      console.log({ result });

      if (result.outputs) Object.assign(outputs, result.outputs);
    }

    outputs
  },
});
