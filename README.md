# Metadata Auto Classifier

Spend less time tagging and organizing metadata, Metadata Auto Classifier automatically generates relevant metadata for your notes.

- **Intelligent Tag Suggestions**: Analyzes your note content and suggests relevant tags, helping you categorize information effortlessly.
- **Custom Frontmatter Classification**: Automatically populates user-defined frontmatter fields based on note content, creating a rich, structured dataset within your vault.
- **Custom commands**: Fetch tags and frontmatter using your preferred command.


## 🛠️ Installation
> **Note**: The plugin is on process of being reviewed for the Obsidian Community Plugins. Once the review is complete, we will update this README with the official installation instructions. In the meantime, you can install the beta version using the instructions below.
1. Open Obsidian and navigate to Settings > Community Plugins.
2. Disable Safe Mode if it's currently enabled.
3. Click on "Browse" and search for "Metadata Auto Classifier".
4. Click "Install", then "Enable" to activate the plugin.

### 📦 Manual Installation (Beta)
To install the beta version of the Metadata Auto Classifier plugin using the Beta Reviewers Auto-update Tool (BRAT):

1. Install BRAT from the Obsidian Community Plugins browser
2. In the BRAT settings, click on "Add Beta plugin".
3. Enter the following GitHub repository URL: 
   ```
   https://github.com/beromkoh/obsidian-metadata-auto-classifier
   ```
4. Click "Add Plugin" to install the beta version.
   ![](./assets/brat-install.gif)


## 🖱️ Usage

![](./assets/usecase.gif)

1. Open a note you want to classify.
2. Use the command palette (Cmd/Ctrl + P) and search for:
   - "Fetch tags using current provider" to generate tags.
   - "Fetch all frontmatter using current provider" to populate custom frontmatter fields.
   - Also, you can fetch single frontmatter field using command palette.
3. Review and edit the AI-generated suggestions as needed.

## 📋 Current Features
- **OpenAI GPT Integration**: Leverages OpenAI's GPT models for metadata generation.
- **Tag Suggestions**: Automatically suggests tags based on note content.
- **Frontmatter Classification**: Populates user-defined frontmatter fields.
- **Customizable Settings**: Adjust the number of tags and frontmatter options.
- **User-Friendly Commands**: Easy access through Obsidian's command palette.
- **Settings Panel**: Configure API keys and classification parameters.

## 🤝 Contributing
We welcome contributions to enhance the Metadata Auto Classifier! Whether it's bug fixes, feature additions, or documentation improvements, your input is valuable. Please feel free to submit a Pull Request or open an issue for discussion.

## 🆘 Support
If you encounter any issues or have suggestions for improvements, please don't hesitate to open an issue on our GitHub repository. We're committed to making this plugin as useful and robust as possible for the Obsidian community.

## 📜 License
This project is licensed under the [MIT License](LICENSE).
