import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  {
    ignores: [".next*/**", "test-results/**", "playwright-report/**", ".e2e-data/**", ".local-data/**"],
  },
  ...nextVitals,
  {
    rules: {
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "@next/next/no-img-element": "warn",
    },
  },
];

export default eslintConfig;
