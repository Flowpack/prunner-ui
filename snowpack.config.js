const proxy = require("http2-proxy");

/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
  mount: {
    public: "/",
    src: "/dist",
  },
  plugins: ["@snowpack/plugin-postcss", "@snowpack/plugin-react-refresh"],
  routes: [
    {
      src: "/api/.*",
      dest: (req, res) => {
        // remove /api prefix (optional)
        req.url = req.url.replace(/^\/api/, "");

        return proxy.web(req, res, {
          hostname: "localhost",
          port: 9009,
        });
      },
    },
  ],
  optimize: {
    bundle: true,
    minify: true,
    splitting: false,
    treeshake: true,
    target: "es2018",
  },
  packageOptions: {
    /* ... */
  },
  devOptions: {
    tailwindConfig: "./tailwind.config.js",
  },
  buildOptions: {
    /* ... */
  },
};
