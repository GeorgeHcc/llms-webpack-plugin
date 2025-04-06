# llms-webpack-plugin

`llms-webpack-plugin` is a Webpack plugin that processes Markdown files and `llms.txt` files following the [llms.txt specification](https://llmstxt.org). It supports middleware functionality in development mode and file copying in build mode.


## Features

- **Development Mode**:

  - Provides a middleware to dynamically serve `llms.txt` and Markdown files.
  - Automatically scans the specified directory for Markdown files and logs available routes.

- **Build Mode**:
  - Copies `llms.txt` and all Markdown files to the Webpack output directory.
  - Generates Webpack assets for easy use in the built project.

## Installation

Install the plugin using npm:

```bash
npm install llms-webpack-plugin --save-dev
```

## Usage
Add `LLMSWebpackPlugin` to your Webpack configuration:

```javascript
// webpack.config.js
const LLMSWebpackPlugin = require('llms-webpack-plugin');

module.exports = {
  mode: 'development', // or 'production'
  plugins: [
    new LLMSWebpackPlugin({
      llmsDir: 'path/to/llms', // Specify the directory for llms files (default: 'llms')
    }),
  ],
};

```
### Options

| Option     | Type     | Default  | Description                              |
|------------|----------|----------|------------------------------------------|
| `llmsDir`  | `string` | `"llms"` | Specifies the directory for `llms.txt` and Markdown files |

## Example

Assume your project structure is as follows:

```
project/
├── llms/
│   ├── llms.txt
│   ├── example.md
├── src/
│   ├── index.js
├── webpack.config.js
```

In development mode, the plugin will:
- Serve routes for `/llms.txt` and `/example.md`.
- Dynamically read the contents of `llms.txt` and Markdown files and return them via middleware.

In build mode, the plugin will:
- Copy `llms.txt` and `example.md` to the Webpack output directory.

## Output Example

After building, the output directory might look like this:

```
dist/
├── llms.txt
├── example.md
```