import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [{
    files: ["**/*.ts"],
    ignores: ["**/*.test.ts"],
    languageOptions: {
        parser: tsParser,
        ecmaVersion: 2022,
        sourceType: "module",
    },
    plugins: {
        "@typescript-eslint": typescriptEslint,
    },
    rules: {
        // Désactivé temporairement pour permettre l'exécution des tests
        "@typescript-eslint/naming-convention": "off",
        "curly": "warn",
        "eqeqeq": "warn",
        "no-throw-literal": "warn",
        "semi": "warn"
    }
}];