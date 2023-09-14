import * as exp from 'constants';
import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, parseLinktext, TFile } from 'obsidian';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// This adds a export command to the dropdown menu
		this.addCommand({
			id: 'run-export',
			name: 'Export to main file!',
			callback: async () => {
				// Get current opened file
				const view = this.app.workspace.getActiveViewOfType(MarkdownView);

				if (view == null) {
					new FailModal(this.app, "No View Found!");
					return;
				} else if (view.file == null) {
					new FailModal(this.app, "No File Found!");
					return;
				}

				// Gather all vault files
				const VaultFiles = this.app.vault.getMarkdownFiles();

				// Run code
				async function Recursive(app: App, currentFile: TFile, layer: string, firtRun : boolean = false): Promise<string> {
					// Get the files altered content
					const fileString = await app.vault.read(currentFile);

					// TODO: This assumes that the file needs to be split
					var fileLineData = fileString.split('\n');

					// Store for current Data
					var Export = "";
					if(!firtRun){
						Export = layer + " " + currentFile.basename + "\n";
					}

					// TODO: Add Title Of Document?

					// Begin the parsing
					for (let line of fileLineData) {
						if (line.length == 0) {
							Export += '\n';
							continue;
						}

						// new FailModal(app, "Line: " + line).open();

						// Check if the line has an Obsidian embed link
						const embedLinkPattern = /^!\[\[(?![^[]+\.\S)(.+?)(?:\|.+?)?\]\]/; 
						const match = line.match(embedLinkPattern);

						if (match) {
							const linkPath = match[1]; // This extracts 'path/to/file' from '![[path/to/file|alias]]'
							// new FailModal(app, "Link: " + linkPath).open();
							
							// Search by exact path first. This handles folder links and avoids duplicates.
							let FileOut = VaultFiles.find(file => file.path === linkPath + ".md");
							
							// If not found by exact path, and it doesn't look like a folder link, try to find by filename
							if (!FileOut && !linkPath.includes('/')) {
								FileOut = VaultFiles.find(file => file.path.endsWith(linkPath + ".md"));
							}
							
							if (!FileOut) {
								new FailModal(app, "Failed to find file link: " + linkPath).open();
								continue;
							}

							const result = await Recursive(app, FileOut, layer + "#");
							Export += result;
							continue;
						}

						// File headers
						if (line[0] == "#") {
							// We want to add the layered hashtags
							Export += layer;
						}

						// Load line
						Export += line + '\n';
					}

					return Export;
				};

				(async () => {
					const ExportString = await Recursive(this.app, view.file, "", true);

					// new FailModal(this.app, "Result: " + ExportString).open();
					// new FailModal(this.app, view.file.basename + "_Export.md").open();

					try {
						const outFile = await this.app.vault.create(view.file.basename + "_Export.md", ExportString);
					} catch (error) {
						new FailModal(this.app, "Error creating or modifying the file:" + error).open();
					}

					// Write export data
					// await this.app.vault.modify(outFile, ExportString);

					// Send confirmation of export
					new ConfirmationModal(this.app).open();
				})();
			}
		});
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class FailModal extends Modal {
	WHY : string

	constructor(app: App, why : string) {
		super(app);

		this.WHY = why
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Failed: ' + this.WHY);
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class ConfirmationModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Exported!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}
