import type { App } from 'obsidian';
import { FuzzySuggestModal } from 'obsidian';
import type { FrontmatterRef } from 'ui/types';

export class FrontmatterSelectModal extends FuzzySuggestModal<FrontmatterRef> {
	constructor(
		app: App,
		readonly options: FrontmatterRef[],
		readonly callback: (selectedId: number | null) => void
	) {
		super(app);
		this.setPlaceholder('Select frontmatter to fetch');
	}

	getItems(): FrontmatterRef[] {
		return this.options;
	}

	getItemText(item: FrontmatterRef): string {
		return item.name;
	}

	onChooseItem(item: FrontmatterRef, evt: MouseEvent | KeyboardEvent): void {
		if (this.callback) {
			this.callback(item.id);
		}
	}
}
