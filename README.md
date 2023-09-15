# Obsidian-Markdown-Exporter

A plugin for obsidian that combines all linked files into one export.

It will recursively look over the current file and all linked and sub-linked files and copy all of their data into one markdown file.

![Plugin Version](https://img.shields.io/badge/version-v1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

The Obsidian-Markdown-Exporter efficiently collects content from your current file, its linked files, and their linked files, enabling you to consolidate all this data into a single markdown file. This capability is particularly valuable for crafting comprehensive documents in your Obsidian vault.

## Features

Recursive Copying: Seamlessly copy content from the current file, its linked files, and their linked files, and so forth, recursively merging it into a unified markdown file.

### Installation

- Launch your Obsidian.md vault.

- Navigate to Settings.

- Select Community Plugins.

- Search for "Obsidian Markdown Exporter" and install it.

- After installation, activate the plugin.

- Customize the plugin's hotkey to align with your preferences.

## Usage

Open the file from which you wish to initiate the recursive copy.

Employ the plugin command via the command pallete by searching for "export to main" or utilise your designated keyboard shortcut to trigger the recursive copy procedure.

The plugin will generate an output markdown file named `{filename}_export.md` containing all the collected content.

Feel free to utilize and modify the generated file as needed.

## License

This plugin operates under the MIT License. Consult the [LICENSE](LISCENCE.md) file for comprehensive licensing details.

## Support

For inquiries or if you encounter any difficulties, please consult the [FAQ](FAQ.md) or submit an issue on our GitHub repository.
