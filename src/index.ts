import { resolve, join } from "path";
import { PathOrFileDescriptor, readFileSync, readdirSync, statSync } from "fs";
import { RawSource } from "webpack-sources";
import { Compiler, WebpackPluginInstance } from "webpack";

interface LLMSWebpackPluginOptions {
  llmsDir?: string;
}
class LLMSWebpackPlugin implements WebpackPluginInstance {
  private options: LLMSWebpackPluginOptions;
  private llmsDir: string;

  constructor(options: LLMSWebpackPluginOptions = {}) {
    this.options = options;
    this.llmsDir = options.llmsDir || "llms";
  }

  apply(compiler: Compiler) {
    if (compiler.options.mode === "development") {
      this.setupDevServerMiddleware(compiler);
    }

    // Copy markdown files to output directory
    this.setupBuildCopy(compiler);
  }

  private setupDevServerMiddleware(compiler: Compiler): void {
    const originalSetupMiddlewares =
      compiler.options.devServer &&
      /** not compatiable webpack v4,need use compiler.options.devServer.before */
      compiler.options.devServer.setupMiddlewares;
    const llmsDirAbsolute = resolve(process.cwd(), this.llmsDir);

    compiler.options.devServer = {
      ...compiler.options.devServer,
      setupMiddlewares: (
        middlewares: { name: string; middleware: (req: any, res: any, next: any) => void }[],
        devServer: any
      ) => {
        if (typeof originalSetupMiddlewares === "function") {
          middlewares = originalSetupMiddlewares(middlewares, devServer);
        }

        try {
          const mdFiles = getAllMarkdownFiles(llmsDirAbsolute);
          const routes = mdFiles.map((file: string) =>
            file.replace(llmsDirAbsolute, "").replace(/\\/g, "/")
          );

          console.log("\nLLMS Plugin: Available markdown routes:");
          console.log("  /llms.txt");
          routes.forEach((route: any) => console.log(`  ${route}`));
        } catch (error) {
          console.error("LLMS Plugin: Error reading markdown files:", error);
        }

        // Add middleware to handle requests for markdown files
        middlewares.unshift({
          name: "llms-middleware",
          middleware: (req, res, next) => {
            // handle requests for markdown files
            if (req.url === "/llms.txt") {
              try {
                const content = readFileSync(join(llmsDirAbsolute, "llms.txt"), "utf-8");
                res.setHeader("Content-Type", "text/markdown");
                res.end(content);
              } catch (e) {
                next();
              }
              return;
            }

            if (req.url?.endsWith(".md")) {
              const pathname = new URL(req.url, "http://localhost").pathname;
              try {
                const filePath = join(
                  llmsDirAbsolute,
                  pathname.startsWith("/") ? pathname.slice(1) : pathname
                );
                const content = readFileSync(filePath, "utf-8");
                res.setHeader("Content-Type", "text/markdown");
                res.end(content);
              } catch (e) {
                next();
              }
              return;
            }

            next();
          },
        });

        return middlewares;
      },
    };
  }

  private setupBuildCopy(compiler: Compiler): void {
    compiler.hooks.emit.tapAsync("LLMSWebpackPlugin", (compilation, callback) => {
      try {
        const llmsDirAbsolute = resolve(process.cwd(), this.llmsDir);

        try {
          const llmsTxtPath = join(llmsDirAbsolute, "llms.txt");
          const content = readFileSync(llmsTxtPath, "utf-8");
          /** not compatiable webpack v4, need use API compilation.assets */
          compilation.emitAsset(
            "llms.txt",
            new RawSource(content) as unknown as import("webpack").sources.Source
          );
        } catch (e) {
          console.error("LLMS Plugin: llms.txt not found");
        }

        const mdFiles = getAllMarkdownFiles(llmsDirAbsolute);
        mdFiles.forEach((file: string) => {
          const relativePath = file.replace(llmsDirAbsolute, "").replace(/\\/g, "/");
          const outputPath = relativePath.startsWith("/") ? relativePath.slice(1) : relativePath;

          compilation.emitAsset(
            outputPath,
            new RawSource(
              readFileSync(file, "utf-8")
            ) as unknown as import("webpack").sources.Source
          );
        });

        console.log("\nLLMS Plugin: Build complete");
        console.log("Copied files:");
        mdFiles.forEach((file: string) => {
          const route = file.replace(llmsDirAbsolute, "").replace(/\\/g, "/");
          console.log(`  ${route}`);
        });
        console.log("  /llms.txt");
      } catch (error) {
        console.error("LLMS Plugin: Build error:", error);
      }
      callback();
    });
  }
}

function getAllMarkdownFiles(dir: string): string[] {
  let results: any[] = [];
  try {
    const files = readdirSync(dir);
    for (const file of files) {
      const filePath = join(dir, file);
      const stat = statSync(filePath);
      if (stat.isDirectory()) {
        results = results.concat(getAllMarkdownFiles(filePath));
      } else if (file.endsWith(".md")) {
        results.push(filePath);
      }
    }
  } catch (error) {
    console.error("LLMS Plugin: Directory read error:", error);
  }
  return results;
}

export default LLMSWebpackPlugin;
