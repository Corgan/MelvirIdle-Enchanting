const { loadModule } = mod.getContext(import.meta);

const { UIComponent } = await loadModule('src/components/ui-component.mjs');

export class EnchantingPageUIComponent extends UIComponent {
    constructor() {
        super('enchanting-page-component');

        this.page = getElementFromFragment(this.$fragment, 'page', 'div');
    }
}