import {
	CommonButton,
	createButtonConfig,
	createExtraButtonConfig,
} from '../../src/ui/components/common/CommonButton';
import { ButtonComponent, ExtraButtonComponent } from 'obsidian';

describe('CommonButton utilities', () => {
	test('CommonButton configures ButtonComponent', () => {
		const container = {} as HTMLElement;
		const onClick = jest.fn();
		const props = {
			text: 'Click',
			icon: 'icon',
			tooltip: 'tip',
			onClick,
			cta: true,
			warning: true,
			disabled: true,
			className: 'cls',
		};
		const button = CommonButton(container, props);
		expect(button.setButtonText).toHaveBeenCalledWith('Click');
		expect(button.setIcon).toHaveBeenCalledWith('icon');
		expect(button.setTooltip).toHaveBeenCalledWith('tip');
		expect(button.setCta).toHaveBeenCalled();
		expect(button.setWarning).toHaveBeenCalled();
		expect(button.setDisabled).toHaveBeenCalledWith(true);
		expect(button.buttonEl.addClass).toHaveBeenCalledWith('cls');
		expect(button.onClick).toHaveBeenCalledWith(onClick);
	});

	test('createButtonConfig sets button properties', () => {
		const button = new ButtonComponent({} as HTMLElement);
		createButtonConfig({ text: 'A', onClick: jest.fn() })(button);
		expect(button.setButtonText).toHaveBeenCalledWith('A');
	});

	test('createExtraButtonConfig sets extra button properties', () => {
		const extra = new ExtraButtonComponent({} as HTMLElement);
		createExtraButtonConfig({
			icon: 'x',
			tooltip: 't',
			onClick: jest.fn(),
			disabled: true,
			className: 'c',
		})(extra);
		expect(extra.setIcon).toHaveBeenCalledWith('x');
		expect(extra.setTooltip).toHaveBeenCalledWith('t');
		expect(extra.setDisabled).toHaveBeenCalledWith(true);
		expect(extra.extraSettingsEl.addClass).toHaveBeenCalledWith('c');
	});
});
