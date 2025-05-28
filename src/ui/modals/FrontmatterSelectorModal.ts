import type { App} from 'obsidian';
import { FuzzySuggestModal } from 'obsidian';

interface FrontmatterOption {
	id: number;
	name: string;
}

export class SelectFrontmatterModal extends FuzzySuggestModal<FrontmatterOption> {
	readonly options: FrontmatterOption[];
	readonly callback: (selectedId: number | null) => void;

	constructor(
		app: App,
		options: FrontmatterOption[],
		callback: (selectedId: number | null) => void
	) {
		super(app);
		this.options = options;
		this.callback = callback;
		this.setPlaceholder('Select frontmatter to fetch');
	}

	getItems(): FrontmatterOption[] {
		return this.options;
	}

	getItemText(item: FrontmatterOption): string {
		return item.name;
	}

	onChooseItem(item: FrontmatterOption, evt: MouseEvent | KeyboardEvent): void {
		if (this.callback) {
			this.callback(item.id);
		}
	}
}
