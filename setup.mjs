export async function setup({ characterStorage, gameData, patch, loadTemplates, loadStylesheet, loadModule, onInterfaceAvailable, onCharacterLoaded }) {
    if(typeof getUnlockedAtNodes === 'undefined') {
        function getUnlockedAtNodes(skill, level) {
            const unlockText = templateLangString('MENU_TEXT_UNLOCKED_AT', {
                skillImage: '$$$',
                level: `${level}`,
            });
            const splitText = unlockText.split('$$$');
            const skillImage = createElement('img', {
                classList: ['skill-icon-xs', 'mr-1']
            });
            skillImage.src = skill.media;
            return [document.createTextNode(splitText[0]), skillImage, document.createTextNode(splitText[1])];
        }
        window.getUnlockedAtNodes = getUnlockedAtNodes;
    }
    if(typeof ContainedComponent === 'undefined') {
        class ContainedComponent {
            show() {
                showElement(this.container);
            }
            hide() {
                hideElement(this.container);
            }
            invisible() {
                this.container.classList.add('invisible');
            }
            visible() {
                this.container.classList.remove('invisible');
            }
        }
        window.ContainedComponent = ContainedComponent;
    }

    if(typeof ProgressBar === 'undefined') {
        class ProgressBar {
            constructor(barElem, currentStyle='bg-info') {
                this.barElem = barElem;
                this.currentStyle = currentStyle;
                this.isStriped = false;
                this.isReversed = false;
                this.barElem.classList.add('progress-fast');
            }
            animateProgressFromTimer(timer) {
                this.animateProgress((timer.maxTicks - timer.ticksLeft) * TICK_INTERVAL, timer.maxTicks * TICK_INTERVAL);
            }
            animateProgress(elapsedTime, totalTime) {
                if (!game.settings.enableProgressBars)
                    return;
                if (this.isStriped)
                    this.barElem.classList.remove(...ProgressBar.stripeClasses);
                const delay = -elapsedTime / 1000;
                const duration = totalTime / 1000;
                this.setAnimation('none');
                this.barElem.style.animation = 'none';
                void this.barElem.offsetHeight;
                this.setAnimation(`${duration}s linear ${delay}s 1 progressBar`);
            }
            animateStriped() {
                if (!game.settings.enableProgressBars)
                    return;
                this.setAnimation('');
                this.isStriped = true;
                void this.barElem.offsetHeight;
                this.barElem.style.width = '100%';
                this.barElem.classList.add(...ProgressBar.stripeClasses);
            }
            stopAnimation() {
                if (!game.settings.enableProgressBars)
                    return;
                void this.barElem.offsetHeight;
                if (this.isStriped)
                    this.barElem.classList.remove(...ProgressBar.stripeClasses);
                this.barElem.style.width = '0%';
                this.setAnimation('none');
            }
            setStyle(newStyle) {
                this.barElem.classList.remove(this.currentStyle);
                this.barElem.classList.add(newStyle);
                this.currentStyle = newStyle;
            }
            setAnimation(animation) {
                this.barElem.style.animation = animation;
                if (this.isReversed)
                    this.barElem.style.animationDirection = 'reverse';
            }
            setFixedPosition(percent) {
                if (this.barElem.style.animation !== '')
                    this.stopAnimation();
                this.barElem.style.width = `${percent}%`;
            }
        }
        ProgressBar.stripeClasses = ['progress-bar-striped', 'progress-bar-animated'];
        window.ProgressBar = ProgressBar;
    }

    if(typeof DropDown === 'undefined') {
        class DropDown extends ContainedComponent {
            constructor(parent, id, buttonClasses, optionsClasses, scroll=false, maxOptionsHeight=0) {
                super();
                this.parent = parent;
                this.container = createElement('div', {
                    classList: ['dropdown']
                });
                this.button = this.container.appendChild(createElement('button', {
                    classList: ['btn', 'dropdown-toggle', ...buttonClasses],
                    id: id,
                    attributes: [['type', 'button'], ['data-toggle', 'dropdown'], ['aria-haspopup', 'true'], ['aria-expanded', 'false'], ],
                }));
                const classList = ['dropdown-menu', ...optionsClasses];
                const attributes = [['aria-labelledby', id]];
                if (scroll)
                    classList.push('overflow-y-auto');
                if (maxOptionsHeight > 0) {
                    attributes.push(['style', `max-height: ${maxOptionsHeight}vh;z-index:1000;`]);
                }
                this.optionsContainer = this.container.appendChild(createElement('div', {
                    classList,
                    attributes,
                }));
                this.parent.appendChild(this.container);
            }
            setButtonText(text) {
                this.button.textContent = text;
            }
            setButtonCallback(callback) {
                this.button.onclick = callback;
            }
            addOption(optionContent, callback) {
                const newOption = createElement('a', {
                    classList: ['dropdown-item', 'pointer-enabled', 'pt-1', 'pb-1'],
                    children: optionContent,
                });
                newOption.onclick = callback;
                this.optionsContainer.appendChild(newOption);
            }
            clearOptions() {
                this.optionsContainer.textContent = '';
            }
        }
        window.DropDown = DropDown;
    }

    if(typeof InfoIcon === 'undefined') {
        class InfoIcon extends ContainedComponent {
            constructor(parent, pillClass, size) {
                super();
                this.parent = parent;
                this.container = createElement('div', {
                    classList: ['bank-item', 'no-bg', 'btn-light', 'pointer-enabled', 'm-2', `resize-${size}`],
                });
                this.image = this.container.appendChild(createElement('img', {
                    classList: ['bank-img', 'p-2', `resize-${size}`],
                    parent: this.container,
                }));
                this.text = this.container.appendChild(createElement('div', {
                    classList: ['font-size-sm', 'text-white', 'text-center'],
                })).appendChild(createElement('small', {
                    classList: ['badge-pill', pillClass],
                }));
                this.tooltip = tippy(this.container, {
                    content: '',
                    placement: 'top',
                    allowHTML: true,
                    interactive: false,
                    animation: false,
                });
                parent.appendChild(this.container);
            }
            setImage(media) {
                this.image.src = media;
            }
            setText(text) {
                this.text.textContent = text;
            }
            setTooltip(content) {
                this.tooltip.setContent(content);
            }
            destroy() {
                this.tooltip.destroy();
                this.parent.removeChild(this.container);
            }
            hide() {
                this.container.classList.add('d-none');
            }
            show() {
                this.container.classList.remove('d-none');
            }
        }
        InfoIcon.media = {
            skillXP: 'assets/media/main/xp.svg',
            strXP: "assets/media/skills/strength/strength.svg",
            masteryXP: "assets/media/main/mastery_header.svg",
            poolXP: "assets/media/main/mastery_pool.svg",
            preserveChance: 'assets/media/main/preservation.svg',
            doublingChance: 'assets/media/main/double.svg',
            interval: 'assets/media/main/timer.svg',
            gp: "assets/media/main/coins.svg",
            slayerCoins: "assets/media/main/slayer_coins.svg",
            shopIcon: 'assets/media/main/shop_header.svg',
            perfectCook: 'assets/media/skills/cooking/perfect.png',
            successfulCook: 'assets/media/main/tick.png',
            intervalAlt: 'assets/media/main/lemon_clock.png',
        };

        window.InfoIcon = InfoIcon;
    }

    if(typeof XPIcon === 'undefined') {
        class XPIcon extends InfoIcon {
            constructor(parent, xp, baseXP, size=48) {
                super(parent, 'bg-secondary', size);
                this.xp = xp;
                this.baseXP = baseXP;
                this.setXP(xp, baseXP);
                this.setImage(assets.getURI(InfoIcon.media.skillXP));
            }
            setXP(xp, baseXP) {
                this.xp = Math.floor(xp);
                this.baseXP = Math.floor(baseXP);
                this.setText(`${this.xp}`);
                this.localize();
            }
            localize() {
                this.setTooltip(this.getTooltipContent(this.xp, this.baseXP));
            }
            getTooltipContent(xp, baseXP) {
                return `<div class="text-center"><span class="font-w700 text-warning">${templateLangString('MENU_TEXT_TOOLTIP_SKILL_XP', {
                    xp: `${numberWithCommas(xp)}`,
                })}</span></div><div role="separator" class="dropdown-divider"></div>
            <div class="text-center"><small>${templateLangString('BASE_SKILL_XP', {
                    baseXP: `${baseXP}`
                })}</small>
            <br><small class="${this.getTextClass(xp - baseXP)}">${this.getTextClassSymbol(xp - baseXP)}${templateLangString('FROM_MODIFIERS', {
                    value: numberWithCommas(xp - baseXP)
                })}</small></div>`;
            }
            getTextClass(value) {
                return value >= 0 ? 'text-success' : 'text-danger';
            }
            getTextClassSymbol(value) {
                return value > 0 ? '+' : '';
            }
        }
        window.XPIcon = XPIcon;
    }

    if(typeof MasteryXPIcon === 'undefined') {
        class MasteryXPIcon extends InfoIcon {
            constructor(parent, xp, baseXP, size=48) {
                super(parent, 'bg-secondary', size);
                this.xp = xp;
                this.baseXP = baseXP;
                this.setXP(xp, baseXP);
                this.setImage(assets.getURI(InfoIcon.media.masteryXP));
            }
            localize() {
                this.setTooltip(this.getTooltipContent(this.xp, this.baseXP));
            }
            setXP(xp, baseXP) {
                this.xp = Math.floor(xp);
                this.baseXP = Math.floor(baseXP);
                this.setText(`${this.xp}`);
                this.localize();
            }
            getTooltipContent(xp, baseXP) {
                return `<div class="text-center"><span class="font-w700 text-warning">${templateLangString('MENU_TEXT_TOOLTIP_MASTERY_XP', {
                    value: `${numberWithCommas(xp)}`,
                })}</span></div><div role="separator" class="dropdown-divider"></div>
            <div class="text-center"><small>${templateLangString('BASE_MASTERY_XP', {
                    baseXP: `${baseXP}`
                })}</small>
            <br><small class="${this.getTextClass(xp - baseXP)}">${this.getTextClassSymbol(xp - baseXP)}${templateLangString('FROM_MODIFIERS', {
                    value: numberWithCommas(xp - baseXP)
                })}</small></div>`;
            }
            getTextClass(value) {
                return value >= 0 ? 'text-success' : 'text-danger';
            }
            getTextClassSymbol(value) {
                return value > 0 ? '+' : '';
            }
        }
        window.MasteryXPIcon = MasteryXPIcon;
    }
    if(typeof MasteryPoolIcon === 'undefined') {
        class MasteryPoolIcon extends InfoIcon {
            constructor(parent, xp, size=48) {
                super(parent, 'bg-secondary', size);
                this.xp = xp;
                this.setXP(xp);
                this.setImage(assets.getURI(InfoIcon.media.poolXP));
            }
            localize() {
                this.setTooltip(this.getTooltipContent());
            }
            setXP(xp) {
                this.xp = Math.floor(xp);
                this.setText(`${this.xp}`);
                this.setTooltip(this.getTooltipContent());
            }
            getTooltipContent() {
                return `<div class="text-center">${templateLangString('MENU_TEXT_TOOLTIP_MASTERY_POOL_XP', {
                    value: `${this.xp}`,
                })}<br><small>${getLangString('MENU_TEXT_INCLUSIVE_OF_BONUSES')}</small></div>`;
            }
        }
        window.MasteryPoolIcon = MasteryPoolIcon;
    }

    if(typeof IntervalIcon === 'undefined') {
        class IntervalIcon extends InfoIcon {
            constructor(parent, interval, size=48, altMedia=false) {
                super(parent, 'bg-primary', size);
                this.localize();
                this.setInterval(interval);
                this.setMedia(altMedia);
            }
            setMedia(altMedia) {
                this.setImage(assets.getURI(altMedia ? InfoIcon.media.intervalAlt : InfoIcon.media.interval));
            }
            localize() {
                this.setTooltip(`<div class="text-center text-warning">${getLangString('MENU_TEXT_TOOLTIP_INTERVAL')}<br><small>${getLangString('MENU_TEXT_INCLUSIVE_OF_BONUSES')}</small></div>`);
            }
            setInterval(interval) {
                this.setText(templateLangString('INTERVAL_SECONDS', {
                    value: formatFixed(interval / 1000, 2)
                }));
            }
        }
        window.IntervalIcon = IntervalIcon;
    }
    
    if(typeof QtyIcon === 'undefined') {
        class QtyIcon extends InfoIcon {
            constructor(parent, qty, size=48) {
                super(parent, 'bg-secondary', size);
                this.qty = qty;
                this.setText(numberWithCommas(this.qty));
            }
            localize() {
                this.setTooltip(this.getTooltipContent());
            }
            updateQuantity() {
                if (this.getCurrentQty() >= this.qty) {
                    this.container.classList.remove('border-item-invalid');
                } else {
                    this.container.classList.add('border-item-invalid');
                }
            }
            getTooltipContent() {
                return `<div class="text-center">${this.getName()}</div>`;
            }
        }
        window.QtyIcon = QtyIcon;
    }

    if(typeof ItemQtyIcon === 'undefined') {
        class ItemQtyIcon extends QtyIcon {
            constructor(parent, quickBuy=false, qty=0, size=48) {
                super(parent, qty, size);
                this.allowQuickBuy = false;
                this.autoBuyIcon = createElement('img', {
                    classList: ['skill-icon-xxs', 'is-in-shop', 'd-none'],
                    attributes: [['src', assets.getURI(InfoIcon.media.shopIcon)]],
                });
                this.container.append(this.autoBuyIcon);
                this.allowQuickBuy = quickBuy;
            }
            setItem(item, qty, altMedia=false) {
                this.item = item;
                this.qty = qty;
                this.setText(numberWithCommas(qty));
                this.localize();
                this.image.src = altMedia ? item.altMedia : item.media;
                const purchase = game.shop.getQuickBuyPurchase(item);
                if (this.allowQuickBuy && purchase !== undefined) {
                    showElement(this.autoBuyIcon);
                    this.container.onclick = ()=>game.shop.quickBuyItemOnClick(purchase);
                } else {
                    hideElement(this.autoBuyIcon);
                    this.container.onclick = null;
                }
            }
            getCurrentQty() {
                if (this.item === undefined)
                    return 0;
                return game.bank.getQty(this.item);
            }
            getName() {
                if (this.item === undefined)
                    return '';
                return this.item.name;
            }
        }
        window.ItemQtyIcon = ItemQtyIcon;
    }
    if(typeof ItemChanceIcon === 'undefined') {
        class ItemChanceIcon extends InfoIcon {
            constructor(parent, size=48) {
                super(parent, 'bg-secondary', size);
            }
            setItem(item) {
                this.item = item;
                this.setImage(item.media);
                this.localize();
            }
            localize() {
                this.setTooltip(this.getTooltipContent());
            }
            getTooltipContent() {
                if (this.item === undefined)
                    return '';
                return `<div class="text-center">${this.item.name}</div>`;
            }
            setChance(chance) {
                this.setText(formatPercent(chance, 2));
            }
        }
        window.ItemChanceIcon = ItemChanceIcon;
    }
    if(typeof QtyCurrentIcon === 'undefined') {
        class QtyCurrentIcon extends InfoIcon {
            constructor(parent, requiredQty, size = 48) { super(parent, 'bg-primary', size); this.currentQuantity = 0; this.requiredQuantity = requiredQty; }
            localize() { this.setTooltip(this.getTooltipContent()); }
            init() { this.updateQuantity(); this.localize(); this.container.onmouseover = () => this.onMouseover(); this.container.onmouseleave = () => this.onMouseleave(); }
            updateQuantity() {
                this.currentQuantity = this.getCurrentQty(); this.setText(formatNumber(this.currentQuantity)); if (this.currentQuantity >= this.requiredQuantity) { this.container.classList.remove('border-item-invalid'); }
                else { this.container.classList.add('border-item-invalid'); }
            }
            onMouseover() { this.setText(numberWithCommas(this.currentQuantity)); }
            onMouseleave() { this.setText(formatNumber(this.currentQuantity)); }
            getTooltipContent() { return `<div class="text-center">${this.getName()}</div>`; }
        }
        window.QtyCurrentIcon = QtyCurrentIcon;
    }
    if(typeof ItemCurrentIcon === 'undefined') {
        class ItemCurrentIcon extends QtyCurrentIcon {
            constructor(parent, item, requiredQty, quickBuy = false, size = 48, altMedia = false) { super(parent, requiredQty, size); this.item = item; this.init(); this.setImage(altMedia ? item.altMedia : item.media); const purchase = game.shop.getQuickBuyPurchase(item); if (quickBuy && purchase !== undefined) { const autoBuyIcon = createElement('img', { classList: ['skill-icon-xxs', 'is-in-shop'], attributes: [['src', assets.getURI(InfoIcon.media.shopIcon)]], }); this.container.append(autoBuyIcon); this.container.onclick = () => game.shop.quickBuyItemOnClick(purchase); } }
            getCurrentQty() { return game.bank.getQty(this.item); }
            getName() { return this.item.name; }
        }
        window.ItemCurrentIcon = ItemCurrentIcon;
    }
    if(typeof DoublingIcon === 'undefined') {
        class DoublingIcon extends InfoIcon {
            constructor(parent, chance, size=48) {
                super(parent, 'bg-primary', size);
                this.localize();
                this.setChance(chance);
                this.setImage(assets.getURI(InfoIcon.media.doublingChance));
            }
            localize() {
                this.setTooltip(this.getTooltipContent());
            }
            getTooltipContent() {
                return `
            <h5 class="font-w400 font-size-sm mb-1 text-warning text-center">${getLangString('MENU_TEXT_TOOLTIP_DOUBLE')}</h5>
            <h5 class="font-w400 font-size-sm mb-1 text-danger text-center">${templateString(getLangString('MENU_TEXT_TOOLTIP_CAPPED'), {
                    chance: '100'
                })}</h5>
            <h5 class="font-w400 font-size-sm mb-1 text-center">
            <small>${getLangString('MENU_TEXT_TOOLTIP_CHANCE_BELOW')}</small>
            </h5>
            <h5 class="font-w400 font-size-sm mb-1 text-center text-info">
            <small>${getLangString('MENU_TEXT_TOOLTIP_FUTURE_UPDATE')}</small>
            </h5>
            `;
            }
            setChance(chance) {
                this.setText(formatPercent(Math.round(chance)));
            }
        }
        window.DoublingIcon = DoublingIcon;
    }

    if(typeof PreservationIcon === 'undefined') {
        class PreservationIcon extends InfoIcon {
            constructor(parent, chance, size=48) {
                super(parent, 'bg-primary', size);
                this.localize();
                this.setChance(chance);
                this.setImage(assets.getURI(InfoIcon.media.preserveChance));
            }
            localize() {
                this.setTooltip(this.getTooltipContent());
            }
            getTooltipContent() {
                return `
            <h5 class="font-w400 font-size-sm mb-1 text-warning text-center">${getLangString('MENU_TEXT_TOOLTIP_PRESERVE')}</h5>
            <h5 class="font-w400 font-size-sm mb-1 text-danger text-center">${templateString(getLangString('MENU_TEXT_TOOLTIP_CAPPED'), {
                    chance: '80'
                })}</h5>
            <h5 class="font-w400 font-size-sm mb-1 text-center">
            <small>${getLangString('MENU_TEXT_TOOLTIP_CHANCE_BELOW')}</small>
            </h5>
            <h5 class="font-w400 font-size-sm mb-1 text-center text-info">
            <small>${getLangString('MENU_TEXT_TOOLTIP_FUTURE_UPDATE')}</small>
            </h5>
            `;
            }
            setChance(chance) {
                this.setText(formatPercent(Math.round(chance)));
            }
        }
        window.PreservationIcon = PreservationIcon;
    }

    if(typeof ArtisanMenu === 'undefined') {
        class ArtisanMenu extends ContainedComponent {
            constructor(containerID, skill) {
                super();
                this.skill = skill;
                this.recipeDropdownItems = [];
                this.progressTimestamp = 0;
                this.progressInterval = 0;
                this.noneSelected = true;
                const parent = document.getElementById(containerID);
                if (parent === null)
                    throw new Error(`Could not get container with ID: ${containerID}`);
                this.parent = parent;
                this.container = parent.appendChild(createElement('div', {
                    classList: ['col-12']
                })).appendChild(createElement('div', {
                    classList: ['block-content', 'block-content-full']
                })).appendChild(createElement('div', {
                    classList: ['row', 'gutters-tiny']
                })).appendChild(createElement('div', {
                    classList: ['col-12']
                }));
                this.nameRow = createElement('div', {
                    classList: ['row', 'row-deck', 'gutters-tiny'],
                    parent: this.container
                });
                const blockClasses = ['block', 'block-rounded-double', 'bg-combat-inner-dark'];
                const colClasses = ['col-12', ...blockClasses];
                this.productBlock = this.nameRow.appendChild(createElement('div', {
                    classList: ['col-4']
                })).appendChild(createElement('div', {
                    classList: [...blockClasses, 'text-center', 'p-3']
                }));
                this.productImage = this.productBlock.appendChild(createElement('img', {
                    classList: ['bank-img-detail'],
                    attributes: [['src', this.skill.media]],
                }));
                this.productQuantity = this.productBlock.appendChild(createElement('div', {
                    attributes: [['style', 'position:absolute;left:0;bottom:10px;width:100%;']]
                })).appendChild(createElement('small', {
                    classList: ['font-w600', 'badge-pill', 'bg-secondary', 'm-1', 'text-white'],
                    text: '-',
                }));
                this.createBlock = this.nameRow.appendChild(createElement('div', {
                    classList: ['col-8']
                })).appendChild(createElement('div', {
                    classList: [...blockClasses, 'pt-2', 'pl-2', 'pr-2', 'pb-1']
                }));
                this.createText = this.createBlock.appendChild(createElement('h5', {
                    classList: ['font-size-sm', 'font-w600', 'text-muted', 'm-1']
                })).appendChild(createElement('small'));
                this.productName = this.createBlock.appendChild(createElement('h5', {
                    classList: ['font-w700', 'text-left', 'text-combat-smoke', 'm-1']
                })).appendChild(createElement('span', {
                    text: '-'
                }));
                this.productDescription = this.createBlock.appendChild(createElement('h5', {
                    classList: ['font-w400', 'font-size-sm', 'text-left', 'text-bank-desc', 'm-1', 'mb-2']
                })).appendChild(createElement('small'));
                this.selectedText = this.createBlock.appendChild(createElement('h5', {
                    classList: ['font-w400', 'font-size-sm', 'text-left', 'text-bank-desc', 'm-1', 'mb-2']
                })).appendChild(createElement('small'));
                this.viewStatsText = this.createBlock.appendChild(createElement('h5', {
                    classList: ['font-w400', 'font-size-sm', 'text-left', 'combat-action', 'm-1', 'mb-2', 'pointer-enabled', 'd-none', ],
                }));
                this.buffsContainer = this.createBlock.appendChild(createElement('div', {
                    classList: ['col-12']
                })).appendChild(createElement('div', {
                    classList: ['row']
                }));
                this.productPreservation = new PreservationIcon(this.buffsContainer,69);
                this.productDoubling = new DoublingIcon(this.buffsContainer,69);
                this.masteryCol = createElement('div', {
                    classList: [...colClasses, 'p-1'],
                    parent: this.container
                });
                const masteryParent = createElement('div', {
                    classList: ['col-12', 'col-md-8']
                });
                this.masteryCol.appendChild(createElement('div', {
                    classList: ['row', 'no-gutters']
                })).append(createElement('div', {
                    classList: ['col-md-2']
                }), masteryParent);
                this.mastery = new MasteryDisplayElement();
                this.mastery.classList.add('mastery-6');
                masteryParent.append(this.mastery);
                this.ingredientsCol = createElement('div', {
                    classList: [...colClasses, 'pt-2', 'pb-1', 'text-center'],
                    parent: this.container,
                });
                const ingRow = createElement('div', {
                    classList: ['row', 'no-gutters'],
                    parent: this.ingredientsCol
                });
                this.dropDownCont = ingRow.appendChild(createElement('div', {
                    classList: ['col-12', 'd-none']
                }));
                this.recipeDropdown = new DropDown(this.dropDownCont,`${this.skill.id}-artisan-menu-recipe-select`,['btn-sm', 'btn-primary'],['font-size-sm'],true,60);
                const boxClasses = ['col-12', 'col-sm-6', 'pb-2'];
                this.requires = new RequiresBox(ingRow,false,boxClasses);
                this.haves = new HavesBox(ingRow,false,boxClasses);
                this.productsCol = createElement('div', {
                    classList: [...colClasses, 'pt-2', 'pb-1', 'text-center'],
                    parent: this.container,
                });
                const prodRow = createElement('div', {
                    classList: ['row', 'no-gutters'],
                    parent: this.productsCol
                });
                this.produces = new ProducesBox(prodRow,false,boxClasses);
                this.productIcon = new ItemQtyIcon(this.produces.iconContainer,false,0);
                this.productIcon.hide();
                this.produces.addIcon(this.productIcon);
                this.grants = new GrantsBox(prodRow,false,boxClasses);
                this.creationCol = createElement('div', {
                    classList: [...colClasses, 'p-3', 'text-center'],
                    parent: this.container,
                });
                const createRow = createElement('div', {
                    classList: ['row', 'justify-content-center'],
                    parent: this.creationCol
                });
                this.createButton = createRow.appendChild(createElement('div')).appendChild(createElement('button', {
                    classList: ['btn', 'btn-success', 'm-1', 'p-2'],
                    attributes: [['type', 'button'], ['style', 'height:48px;'], ],
                }));
                this.interval = new IntervalIcon(createRow,0);
                const progressDiv = createRow.appendChild(createElement('div', {
                    classList: ['col-12']
                })).appendChild(createElement('div', {
                    classList: ['progress', 'active', 'mt-3'],
                    attributes: [['style', 'height:5px;']]
                })).appendChild(createElement('div', {
                    classList: ['progress-bar', 'bg-info'],
                    attributes: [['role', 'progressbar'], ['style', 'width:0%;'], ['aria-valuenow', '0'], ['aria-valuenow', '0'], ['aria-valuemin', '0'], ['aria-valuemax', '100'], ],
                }));
                this.progressBar = new ProgressBar(progressDiv);
            }
            localize() {
                this.createText.textContent = getLangString('MENU_TEXT_CREATE');
                if (this.product !== undefined) {
                    this.productName.textContent = this.product.name;
                    this.productDescription.textContent = '';
                    if (this.product.hasDescription) {
                        this.productDescription.append(...$.parseHTML(this.product.description));
                    }
                }
                this.selectedText.textContent = getLangString('MENU_TEXT_NONE_SELECTED');
                this.viewStatsText.textContent = getLangString('MENU_TEXT_VIEW_STATS');
                this.requires.localize();
                this.haves.localize();
                this.produces.localize();
                this.grants.localize();
                this.createButton.textContent = getLangString('MENU_TEXT_CREATE');
                this.productDoubling.localize();
                this.productPreservation.localize();
                this.interval.localize();
                this.recipeDropdown.setButtonText(getLangString('MENU_TEXT_SELECT_RECIPE'));
                this.recipeDropdownItems.forEach((recipe)=>{
                    recipe.forEach((icon)=>icon.localize());
                }
                );
            }
            setSelected(recipe) {
                if (this.noneSelected) {
                    this.requires.setSelected();
                    this.haves.setSelected();
                    this.grants.setSelected();
                    this.produces.setSelected();
                    hideElement(this.selectedText);
                    this.productIcon.show();
                    this.noneSelected = false;
                }
                this.mastery.setMastery(this.skill, recipe);
            }
            setIngredients(items, gp, sc) {
                this.requires.setItems(items, gp, sc);
                this.haves.setItems(items, gp, sc);
            }
            setIngredientsFromRecipe(recipe) {
                this.requires.setItemsFromRecipe(recipe);
                this.haves.setItemsFromRecipe(recipe);
            }
            setProduct(item, qty) {
                this.product = item;
                this.productImage.src = item.media;
                const bankQty = game.bank.getQty(item);
                this.productQuantity.textContent = bankQty <= 99999999 ? numberWithCommas(bankQty) : formatNumber(bankQty);
                this.productName.textContent = item.name.replace('&apos;', "'");
                if (item instanceof EquipmentItem) {
                    showElement(this.viewStatsText);
                    this.viewStatsText.onclick = ()=>viewItemStats(item);
                } else {
                    hideElement(this.viewStatsText);
                }
                this.productDescription.innerHTML = '';
                if (item.hasDescription) {
                    this.productDescription.innerHTML = item.modifiedDescription;
                }
                if (item instanceof EquipmentItem) {
                    this.productDescription.innerHTML += getSummonMaxHitItemDescription(item);
                }
                this.productIcon.setItem(item, qty);
            }
            updateQuantities() {
                this.haves.updateQuantities();
                if (this.product !== undefined) {
                    const bankQty = game.bank.getQty(this.product);
                    this.productQuantity.textContent = bankQty <= 99999999 ? numberWithCommas(bankQty) : formatNumber(bankQty);
                }
                this.recipeDropdownItems.forEach((recipe)=>{
                    recipe.forEach((icon)=>icon.updateQuantity());
                }
                );
            }
            updateGrants(xp, baseXP, masteryXP, baseMasteryXP, poolXP) {
                this.grants.updateGrants(xp, baseXP, masteryXP, baseMasteryXP, poolXP);
            }
            updateChances(preserveChance, doublingChance) {
                this.productPreservation.setChance(preserveChance);
                this.productDoubling.setChance(doublingChance);
            }
            updateInterval(interval) {
                this.interval.setInterval(interval);
            }
            setCreateCallback(callback) {
                this.createButton.onclick = ()=>{
                    callback(),
                    this.createButton.blur();
                }
                ;
            }
            animateProgressFromTimer(timer) {
                this.progressBar.animateProgressFromTimer(timer);
            }
            startProgressBar(interval) {
                this.progressBar.animateProgress(0, interval);
                this.progressInterval = interval;
                this.progressTimestamp = performance.now();
            }
            stopProgressBar() {
                this.progressBar.stopAnimation();
            }
            updateProgressBar() {
                const newTimestamp = performance.now();
                const timeDiff = newTimestamp - this.progressTimestamp;
                if (timeDiff < this.progressInterval) {
                    this.progressBar.animateProgress(timeDiff, this.progressInterval);
                    this.progressTimestamp = newTimestamp;
                } else {
                    this.progressBar.stopAnimation();
                }
            }
            hideRecipeDropdown() {
                hideElement(this.dropDownCont);
            }
            showRecipeDropdown() {
                showElement(this.dropDownCont);
            }
            setRecipeDropdown(altRecipeIngredients, selectCallback, displayOrder) {
                this.recipeDropdownItems.forEach((altRecipe)=>{
                    altRecipe.forEach((qtyIcon)=>{
                        qtyIcon.destroy();
                    }
                    );
                }
                );
                this.recipeDropdownItems = [];
                this.recipeDropdown.clearOptions();
                if (displayOrder === undefined)
                    displayOrder = altRecipeIngredients.map((_,i)=>i);
                displayOrder.forEach((i)=>{
                    const altRecipe = altRecipeIngredients[i];
                    const altRecipeContainer = createElement('div', {
                        classList: ['row', 'gutters-tiny']
                    });
                    const icons = createQtyIconsForCosts(altRecipeContainer, 48, false, altRecipe.items, altRecipe.gp, altRecipe.sc);
                    this.recipeDropdownItems.push(icons);
                    this.recipeDropdown.addOption([altRecipeContainer], selectCallback(i));
                }
                );
                this.showRecipeDropdown();
            }
        }
        window.ArtisanMenu = ArtisanMenu;
    }

    if(typeof RecipeSelectionTab === 'undefined') {
        class RecipeSelectionTab extends ContainedComponent {
            constructor(parentID, skill, recipes, containerID, recipeCollapse='md') {
                super();
                this.skill = skill;
                this.recipes = recipes;
                this.recipeCollapse = recipeCollapse;
                this.recipeContainers = [];
                this.recipeTooltips = [];
                this.recipeUnlocked = [];
                const parent = document.getElementById(parentID);
                if (parent === null)
                    throw new Error(`Could not find parent element with id: ${parentID}`);
                this.parent = parent;
                this.container = createElement('div', {
                    classList: ['col-12', 'col-md-8'],
                    id: containerID
                });
                this.recipeRow = this.container.appendChild(createElement('div', {
                    classList: ['block-content']
                })).appendChild(createElement('div', {
                    classList: ['row']
                }));
                this.recipes.forEach(()=>this.addRecipeContainer());
                this.parent.append(this.container);
            }
            updateRecipesForLevel() {
                this.recipes.forEach((recipe,id)=>{
                    if (this.isRecipeUnlocked(recipe)) {
                        if (!this.recipeUnlocked[id])
                            this.setRecipeUnlocked(id);
                    } else {
                        this.setRecipeLocked(id);
                    }
                }
                );
            }
            updateRecipeTooltips() {
                this.recipes.forEach((recipe,id)=>{
                    const tooltip = this.recipeTooltips[id];
                    if (this.recipeUnlocked[id]) {
                        const costs = this.getRecipeIngredients(recipe);
                        tooltip.setContent(this.getRequiresTooltip(costs.getItemQuantityArray(), costs.gp, costs.sc));
                        tooltip.enable();
                    } else {
                        tooltip.disable();
                    }
                }
                );
            }
            localize() {
                this.recipeUnlocked.forEach((unlocked,id)=>{
                    if (unlocked)
                        this.setRecipeUnlocked(id);
                    else
                        this.setRecipeLocked(id);
                }
                );
                this.updateRecipeTooltips();
            }
            isRecipeUnlocked(recipe) {
                return this.skill.level >= recipe.level;
            }
            addRecipeContainer() {
                const container = createElement('div', {
                    classList: ['col-12', `col-${this.recipeCollapse}-6`],
                    parent: this.recipeRow,
                }).appendChild(createElement('ul', {
                    classList: ['nav', 'nav-pills', 'nav-justified', 'push']
                })).appendChild(createElement('li', {
                    classList: ['nav-item', 'mr-1']
                }));
                this.recipeContainers.push(container);
                this.recipeUnlocked.push(false);
                const tooltip = tippy(container, {
                    placement: 'top',
                    allowHTML: true,
                    interactive: false,
                    animation: false,
                });
                this.recipeTooltips.push(tooltip);
            }
            setRecipeUnlocked(id) {
                const container = this.recipeContainers[id];
                const recipe = this.recipes[id];
                container.textContent = '';
                const link = createElement('a', {
                    classList: ['block', 'block-link-pop', 'nav-link', 'border', 'pointer-enabled', 'font-w600'],
                });
                link.onclick = this.getRecipeCallback(recipe);
                const recipeImage = createElement('img', {
                    classList: ['skill-icon-xs', 'mr-2']
                });
                recipeImage.src = this.getRecipeMedia(recipe);
                recipeImage.id = `artisan-recipe-${this.getRecipeID(recipe)}`;
                link.append(recipeImage, document.createTextNode(this.getRecipeName(recipe)));
                this.recipeUnlocked[id] = true;
                container.append(link);
            }
            setRecipeLocked(id) {
                const container = this.recipeContainers[id];
                const recipe = this.recipes[id];
                container.textContent = '';
                const span = createElement('span', {
                    classList: ['nav-link', 'font-size-sm', 'border', 'border-danger', 'text-danger'],
                });
                span.append(...getUnlockedAtNodes(this.skill, recipe.level));
                this.recipeUnlocked[id] = false;
                container.append(span);
            }
            getRequiresTooltip(items, gp, sc) {
                const quantities = [];
                const getQty = (qty,media)=>`${qty} <img class='skill-icon-xs mr-2' src="${media}">`;
                items.forEach(({item, quantity})=>{
                    quantities.push(getQty(quantity, item.media));
                }
                );
                if (gp > 0)
                    quantities.push(getQty(gp, assets.getURI(InfoIcon.media.gp)));
                if (sc > 0)
                    quantities.push(getQty(sc, assets.getURI(InfoIcon.media.slayerCoins)));
                return `
            <small class="text-warning">${getLangString('MENU_TEXT_REQUIRES')}</small><br>
            ${quantities.join('')}
            `;
            }
        }
        window.RecipeSelectionTab = RecipeSelectionTab;
    }

    if(typeof IconBox === 'undefined') {
        class IconBox extends ContainedComponent {
            constructor(parent, smallName, containerClasses=[], iconContClasses=[]) {
                super();
                this.icons = [];
                this.container = createElement('div', {
                    classList: containerClasses
                });
                const nameHeader = createElement('h5', {
                    classList: ['font-w600', 'font-size-sm', 'mb-1', 'text-center'],
                    parent: this.container,
                });
                if (smallName) {
                    this.name = createElement('small', {
                        parent: nameHeader
                    });
                } else {
                    this.name = nameHeader;
                }
                this.iconContainer = createElement('div', {
                    classList: ['row', 'justify-content-center', ...iconContClasses],
                    parent: this.container,
                });
                this.dash = this.iconContainer.appendChild(createElement('span', {
                    text: '-'
                }));
                parent.append(this.container);
            }
            destroyIcons() {
                this.icons.forEach((icon)=>{
                    icon.destroy();
                }
                );
                this.icons = [];
            }
            addIcon(icon) {
                this.icons.push(icon);
            }
            setName(name) {
                this.name.textContent = name;
            }
            localize() {
                this.icons.forEach((icon)=>icon.localize());
            }
            setSelected() {
                this.icons.forEach((icon)=>icon.show());
                hideElement(this.dash);
            }
            setUnselected() {
                this.icons.forEach((icon)=>icon.hide());
                showElement(this.dash);
            }
        }
        window.IconBox = IconBox;
    }
    if(typeof RequiresBox === 'undefined') {
        class RequiresBox extends IconBox {
            constructor(parent, smallName, containerClasses=[], iconContClasses=[], size=48, titleLangID='MENU_TEXT_REQUIRES') {
                super(parent, smallName, containerClasses, iconContClasses);
                this.size = size;
                this.titleLangID = titleLangID;
                this.localize();
            }
            localize() {
                super.localize();
                this.setName(getLangString(this.titleLangID));
            }
            setItems(items, gp=0, sc=0, altMedia=false) {
                this.destroyIcons();
                items.forEach(({item, quantity})=>{
                    const reqIcon = new ItemQtyIcon(this.iconContainer,true,quantity,this.size);
                    reqIcon.setItem(item, quantity, altMedia);
                    this.addIcon(reqIcon);
                }
                );
                if (gp > 0)
                    this.addIcon(new GPQtyIcon(this.iconContainer,gp,this.size));
                if (sc > 0)
                    this.addIcon(new SCQtyIcon(this.iconContainer,sc,this.size));
            }
            setItemsFromRecipe(recipe, altMedia=false) {
                this.destroyIcons();
                recipe.itemCosts.forEach(({item, quantity})=>{
                    const icon = new ItemQtyIcon(this.iconContainer,true,quantity,this.size);
                    icon.setItem(item, quantity, altMedia);
                    this.addIcon(icon);
                }
                );
                if (recipe.gpCost > 0)
                    this.addIcon(new GPQtyIcon(this.iconContainer,recipe.gpCost,this.size));
                if (recipe.scCost > 0)
                    this.addIcon(new SCQtyIcon(this.iconContainer,recipe.scCost,this.size));
            }
            setItemsFromCosts(costs, altMedia=false) {
                this.setItems(costs.getItemQuantityArray(), costs.gp, costs.sc, altMedia);
            }
        }
        window.RequiresBox = RequiresBox;
    }
    if(typeof HavesBox === 'undefined') {
        class HavesBox extends IconBox {
            constructor(parent, smallName, containerClasses=[], iconContClasses=[], size=48, titleLangID='YOU_HAVE') {
                super(parent, smallName, containerClasses, iconContClasses);
                this.size = size;
                this.titleLangID = titleLangID;
                this.localize();
            }
            localize() {
                super.localize();
                this.setName(getLangString(`MENU_TEXT_${this.titleLangID}`));
            }
            updateQuantities() {
                this.icons.forEach((icon)=>icon.updateQuantity());
            }
            setItems(items, gp=0, sc=0, altMedia=false) {
                this.destroyIcons();
                items.forEach(({item, quantity})=>{
                    const reqIcon = new ItemCurrentIcon(this.iconContainer,item,quantity,true,this.size,altMedia);
                    this.addIcon(reqIcon);
                }
                );
                if (gp > 0)
                    this.addIcon(new GPCurrentIcon(this.iconContainer,gp,this.size));
                if (sc > 0)
                    this.addIcon(new SCCurrentIcon(this.iconContainer,sc,this.size));
            }
            setItemsFromRecipe(recipe, altMedia=false) {
                this.destroyIcons();
                recipe.itemCosts.forEach(({item, quantity})=>{
                    this.addIcon(new ItemCurrentIcon(this.iconContainer,item,quantity,true,this.size,altMedia));
                }
                );
                if (recipe.gpCost > 0)
                    this.addIcon(new GPCurrentIcon(this.iconContainer,recipe.gpCost,this.size));
                if (recipe.scCost > 0)
                    this.addIcon(new SCCurrentIcon(this.iconContainer,recipe.scCost,this.size));
            }
            setItemsFromCosts(costs, altMedia=false) {
                this.setItems(costs.getItemQuantityArray(), costs.gp, costs.sc, altMedia);
            }
        }
        window.HavesBox = HavesBox;
    }
    if(typeof ProducesBox === 'undefined') {
        class ProducesBox extends IconBox {
            constructor(parent, smallName, containerClasses=[], iconContClasses=[]) {
                super(parent, smallName, containerClasses, iconContClasses);
                this.size = 48;
                this.localize();
            }
            setItems(items, gp=0, sc=0) {
                this.destroyIcons();
                items.forEach(({item, quantity})=>{
                    const reqIcon = new ItemQtyIcon(this.iconContainer,true,quantity,this.size);
                    reqIcon.setItem(item, quantity);
                    this.addIcon(reqIcon);
                }
                );
                if (gp > 0)
                    this.addIcon(new GPQtyIcon(this.iconContainer,gp,this.size));
                if (sc > 0)
                    this.addIcon(new SCQtyIcon(this.iconContainer,sc,this.size));
            }
            localize() {
                super.localize();
                this.setName(getLangString('MENU_TEXT_PRODUCES'));
            }
        }
        window.ProducesBox = ProducesBox;
    }
    if(typeof GrantsBox === 'undefined') {
        class GrantsBox extends IconBox {
            constructor(parent, smallName, containerClasses=[], size=48, iconContClasses=[]) {
                super(parent, smallName, containerClasses, iconContClasses);
                this.xpIcon = new XPIcon(this.iconContainer,69,69,size);
                this.masteryXPIcon = new MasteryXPIcon(this.iconContainer,69,69,size);
                this.masteryPoolIcon = new MasteryPoolIcon(this.iconContainer,69,size);
                this.addIcon(this.xpIcon);
                this.addIcon(this.masteryXPIcon);
                this.addIcon(this.masteryPoolIcon);
                this.setUnselected();
                this.localize();
            }
            localize() {
                super.localize();
                this.setName(getLangString('MENU_TEXT_GRANTS'));
            }
            updateGrants(xp, baseXP, masteryXP, baseMasteryXP, poolXP) {
                this.xpIcon.setXP(xp, baseXP);
                this.masteryXPIcon.setXP(masteryXP, baseMasteryXP);
                this.masteryPoolIcon.setXP(poolXP);
            }
            hideMastery() {
                this.masteryXPIcon.hide();
                this.masteryPoolIcon.hide();
            }
        }
        window.GrantsBox = GrantsBox;
    }


    console.log("Loading Enchanting Templates");
    await loadTemplates("templates.html"); // Add templates
    
    console.log("Loading Enchanting Stylesheet");
    await loadStylesheet('style.css');

    /*
    modifierData.increasedUpgradeEssenceChance = {
        get langDescription() {
            return "+${value}% chance to disenchant essence at the next tier.";
        },
        description: '+${value}% chance to disenchant essence at the next tier.',
        isSkill: false,
        isNegative: false,
        tags: []
    };
    modifierData.decreasedUpgradeEssenceChance = {
        get langDescription() {
            return "-${value}% chance to disenchant essence at the next tier.";
        },
        description: '-${value}% chance to disenchant essence at the next tier.',
        isSkill: false,
        isNegative: true,
        tags: []
    };
    modifierData.increasedItemRarityChance = {
        get langDescription() {
            return "+${value}% chance for item to drop at the next tier.";
        },
        description: '+${value}% chance for item to drop at the next tier.',
        isSkill: false,
        isNegative: false,
        tags: []
    };
    modifierData.decreasedItemRarityChance = {
        get langDescription() {
            return "-${value}% chance for item to drop at the next tier.";
        },
        description: '-${value}% chance for item to drop at the next tier.',
        isSkill: false,
        isNegative: true,
        tags: []
    };
    modifierData.increasedEnchantCost = {
        get langDescription() {
            return "+${value}% cost of enchanting items.";
        },
        description: '+${value}% cost of enchanting items.',
        isSkill: false,
        isNegative: true,
        tags: []
    };
    modifierData.decreasedEnchantCost = {
        get langDescription() {
            return "-${value}% cost of enchanting items.";
        },
        description: '-${value}% cost of enchanting items.',
        isSkill: false,
        isNegative: false,
        tags: []
    };
    modifierData.increasedEnchantRerollCost = {
        get langDescription() {
            return "+${value}% cost of rerolling modifiers on enchanted items.";
        },
        description: '+${value}% cost of rerolling modifiers on enchanted items.',
        isSkill: false,
        isNegative: true,
        tags: []
    };
    modifierData.decreasedEnchantRerollCost = {
        get langDescription() {
            return "-${value}% cost of rerolling modifiers on enchanted items.";
        },
        description: '-${value}% cost of rerolling modifiers on enchanted items.',
        isSkill: false,
        isNegative: false,
        tags: []
    };
    modifierData.increasedEssenceQuantity = {
        get langDescription() {
            return "+${value}% essence from disenchanting.";
        },
        description: '+${value}% essence from disenchanting.',
        isSkill: false,
        isNegative: false,
        tags: []
    };
    modifierData.decreasedEssenceQuantity = {
        get langDescription() {
            return "-${value}% essence from disenchanting.";
        },
        description: '-${value}% essence from disenchanting.',
        isSkill: false,
        isNegative: true,
        tags: []
    };
    */

    console.log("Loading Enchanting Module");
    const { Enchanting, EnchantingUpgradedWeaponItemWrapper, EnchantingUpgradedEquipmentItemWrapper, EnchantingItemUpgrade } = await loadModule('src/enchanting.mjs');

    game.enchanting = game.registerSkill(game.registeredNamespaces.getNamespace('enchanting'), Enchanting); // Register skill

    console.log("Registering Enchanting Data");
    await gameData.addPackage('data.json'); // Add skill data (page + sidebar, skillData)

    console.log('Registered Enchanting Data.');

    patch(Bank, 'addItem').before(function(item, quantity, ...args) {
        if (item.constructor === EnchantingUpgradedWeaponItemWrapper) {
            item = game.enchanting.createEnchantingWeapon(item.upgradedItem, item.item.quality, item.item.extraModifiers, item.item.extraSpecials);
        } else if(item.constructor === EnchantingUpgradedEquipmentItemWrapper) {
            item = game.enchanting.createEnchantingArmour(item.upgradedItem, item.item.quality, item.item.extraModifiers);
        }
        return [item, quantity, ...args];
    });

    patch(Costs, 'addItem').before(function(item, quantity) {
        if(this instanceof Rewards) {
            if((item.constructor === EquipmentItem || item.constructor === WeaponItem) && game.enchanting.canAugmentItem(item)) { // Skip any Proxied Items
                return game.enchanting.replaceRewards(item, quantity);
            }
        }
        return [item, quantity];
    });

    patch(DropTable, 'getDrop').after(function({item, quantity}) {
        if((item.constructor === EquipmentItem || item.constructor === WeaponItem) && game.enchanting.canAugmentItem(item)) { // Skip any Proxied Items
            return game.enchanting.replaceDrop(item, quantity);
        }
        return {item, quantity};
    });

    const isItemOrProxied = (check, item) => (check === item || (check.item !== undefined && isItemOrProxied(check.item, item)));
    const getBaseItem = (item) => (item.item !== undefined ? getBaseItem(item.item) : item);
    const checkForItemOrProxyIDs = (itemIDs) => {
        const idsNotFound = [...itemIDs];
        return game.combat.player.equipment.equippedArray.some((slot)=>{
            const idIndex = idsNotFound.findIndex((id)=>isItemOrProxied(slot.item, id));
            if (idIndex !== -1)
                idsNotFound.splice(idIndex, 1);
            return idsNotFound.length === 0;
        });
    }

    patch(MappedStatTracker, 'add').before(function(key, statID, qty) {
        if(game.enchanting.isAugmentedItem(key))
            key = key.item;
        return [key, statID, qty];
    })

    patch(MappedStatTracker, 'get').before(function(key, statID) {
        if(game.enchanting.isAugmentedItem(key))
            key = key.item;
        return [key, statID];
    })

    patch(Equipment, 'checkForItem').replace(function(o, item) {
        return this.equippedArray.some((slot) => isItemOrProxied(slot.item, item));
    });

    patch(Equipment, 'checkForItemIDs').replace(function(o, itemIDs) {
        const idsNotFound = [...itemIDs];
        return this.equippedArray.some((slot)=>{
            const idIndex = idsNotFound.findIndex((id)=>isItemOrProxied(slot.item, id));
            if (idIndex !== -1)
                idsNotFound.splice(idIndex, 1);
            return idsNotFound.length === 0;
        });
    });

    patch(EquippedItem, 'isItem').after(function(ret, item) {
      if (ret === false && typeof item !== 'string' && game.enchanting.isAugmentedItem(this.item))
        return isItemOrProxied(this.item, item);
    })
    
    patch(Player, 'computeItemSynergies').after(function() {
        const potentialSynergies = new Set();
        this.equipment.equippedArray.forEach((slot)=>{
            if (slot.providesStats) {
                const synergies = this.game.itemSynergies.get(getBaseItem(slot.item));
                if (synergies !== undefined)
                    synergies.forEach((synergy)=>potentialSynergies.add(synergy));
            }
        });
        potentialSynergies.forEach((synergy)=>{
            if (checkForItemOrProxyIDs(synergy.items))
                this.activeItemSynergies.add(synergy);
        });
    });
    /*

    patch(TownshipCasualTasks, 'updateForValidMonsterWithItemsKill').after(function(_, monster) {
        this.currentCasualTasks.forEach((task, index)=>{
            task.goals.monsterWithItems.forEach((goal, id)=>{
                if (goal.monster === monster) {
                    if(goal.items.every((item)=>this.game.combat.player.equipment.checkForItem(item))) { // If this is true, it was handled in the original function

                    } else {
                        if(goal.items.every((item)=> {
                            const isItemOrProxied = (check) => (check === item || (check.item !== undefined && isItemOrProxied(check.item)));
                            return this.game.combat.player.equipmentSets.some(({equipment})=> equipment.slotArray.some(slot => isItemOrProxied(slot.item)));
                        })) {
                            this.casualTaskTracker[index].monsterWithItems[id].count++;
                        }
                    }
                }
            });
        });
    });
    */

    patch(NamespaceRegistry, 'getObjectByID').replace(function(o, id) {
        let obj = o(id);
        if(obj === undefined && id !== undefined && typeof id === "string" && id.startsWith("enchanting")) {
            return game.enchanting.handleMissingObject(id);
        }
        return obj;
    });

    onCharacterLoaded(async () => {
        game.enchanting.onCharacterLoaded();
    });

    onInterfaceAvailable(async () => {
        console.log("Appending Enchanting Page");
        game.enchanting.component.mount(document.getElementById('main-container')); // Add skill container
    });
}