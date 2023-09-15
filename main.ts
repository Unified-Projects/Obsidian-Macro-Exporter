import * as exp from 'constants';
import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, parseLinktext, TFile } from 'obsidian';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	StackedHashtags : boolean;
	InsertTitles : boolean;
	Export_Prefix : string;
	Export_Suffix : string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	StackedHashtags: true,
	InsertTitles : true,
	Export_Prefix : "",
	Export_Suffix : "_Export"
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
				async function Recursive(app: App, currentFile: TFile, layer: string, settings : MyPluginSettings, firtRun : boolean = false): Promise<string> {
					// Get the files altered content
					const fileString = await app.vault.read(currentFile);

					var fileLineData = fileString.split('\n');

					// Store for current Data
					var Export = "";
					if(!firtRun && settings.InsertTitles && settings.StackedHashtags){
						Export = layer + " " + currentFile.basename + "\n";
					}
					else if(!firtRun && settings.InsertTitles && !settings.StackedHashtags){
						Export = "# " + currentFile.basename + "\n";
					}

					// Begin the parsing
					for (let line of fileLineData) {
						if (line.length == 0) {
							Export += '\n';
							continue;
						}

						// Check if the line has an Obsidian embed link
						const embedLinkPattern = /^!\[\[(?![^[]+\.\S)(.+?)(?:\|.+?)?\]\]/; 
						const match = line.match(embedLinkPattern);

						if (match) {
							const linkPath = match[1]; // This extracts 'path/to/file' from '![[path/to/file|alias]]' and rejects extentions
							
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

							const result = await Recursive(app, FileOut, layer + "#", settings);
							Export += result;
							continue;
						}

						// File headers
						if (line[0] == "#" && settings.StackedHashtags) {
							// We want to add the layered hashtags
							Export += layer;
						}

						// Load line
						Export += line + '\n';
					}

					return Export;
				};

				(async () => {
					const ExportString = await Recursive(this.app, view.file, "", this.settings, true);

					if(this.settings.Export_Prefix == "" && this.settings.Export_Suffix ==  ""){
						new FailModal(this.app, "Cannot replace exporting file, suffix or prefix needed.").open();
					}

					try {
						const outFile = await this.app.vault.create(this.settings.Export_Prefix + view.file.basename + this.settings.Export_Suffix + ".md", ExportString);
					} catch (error) {
						new FailModal(this.app, "Error creating file:" + error).open();
					}

					// Send confirmation of export
					new ConfirmationModal(this.app).open();
				})();
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SettingsTab(this.app, this));
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
		contentEl.setText('Exported Successfully');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SettingsTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app : App, plugin : MyPlugin){
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Insert Titles')
			.setDesc('Add linked file as a new title')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.InsertTitles)
				.onChange(async (value) => {
					this.plugin.settings.InsertTitles = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Chain Hashtags')
			.setDesc('Add new hashtags for each link depth to change title sizes')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.StackedHashtags)
				.onChange(async (value) => {
					this.plugin.settings.StackedHashtags = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Export Prefix')
			.setDesc('The text that comes before the exported file name.')
			.addText(text => text
				.setPlaceholder('_Export')
				.setValue(this.plugin.settings.Export_Prefix)
				.onChange(async (value) => {
					this.plugin.settings.Export_Prefix = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Export Suffix')
			.setDesc('The text that comes after the exported file name.')
			.addText(text => text
				.setPlaceholder('Export_')
				.setValue(this.plugin.settings.Export_Suffix)
				.onChange(async (value) => {
					this.plugin.settings.Export_Suffix = value;
					await this.plugin.saveSettings();
				}));
	}
}