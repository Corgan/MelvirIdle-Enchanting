export async function setup({ characterStorage, gameData, patch, loadTemplates, loadStylesheet, loadModule, onInterfaceAvailable, onCharacterLoaded }) {
    console.log("Loading Enchanting Templates");
    await loadTemplates("templates.html"); // Add templates
    
    console.log("Loading Enchanting Stylesheet");
    await loadStylesheet('style.css');

    console.log("Loading Enchanting Module");
    const { Enchanting, EnchantingUpgradedWeaponItemWrapper, EnchantingUpgradedEquipmentItemWrapper, EnchantingItemUpgrade } = await loadModule('src/enchanting.mjs');

    game.enchanting = game.registerSkill(game.registeredNamespaces.getNamespace('enchanting'), Enchanting); // Register skill

    console.log("Registering Enchanting Data");
    await gameData.addPackage('data.json'); // Add skill data (page + sidebar, skillData)

    console.log('Registered Enchanting Data.');

    const _determineRandomSkillsForUnlock = determineRandomSkillsForUnlock;
    window.determineRandomSkillsForUnlock = function(...args) {
        game.enchanting.setUnlock(false);
        _determineRandomSkillsForUnlock(...args);
        game.enchanting.setUnlock(true);
    }

    patch(CombatManager, 'awardSkillLevelCapIncreaseForDungeonCompletion').before(function(dungeon) {
        if (dungeon.id === "melvorF:Impending_Darkness" || dungeon.id === "melvorTotH:Throne_of_the_Herald") {
            // We do nothing here beacuse it's handled in the base call
        } else if (dungeon.namespace === "melvorTotH") {
            const amount = Math.min(3, 120 - this.game.attack.overrideLevelCap);
            this.game.enchanting.increaseLevelCap(amount);
        } else {
            const amount = Math.min(5, 99 - this.game.attack.overrideLevelCap);
            this.game.enchanting.increaseLevelCap(amount);
        }
    });

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
        return game.combat.player.equipment.slotArray.some((slot)=>{
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
        return this.slotArray.some((slot) => isItemOrProxied(slot.item, item));
    });

    patch(Equipment, 'checkForItemIDs').replace(function(o, itemIDs) {
        const idsNotFound = [...itemIDs];
        return this.slotArray.some((slot)=>{
            const idIndex = idsNotFound.findIndex((id)=>isItemOrProxied(slot.item, id));
            if (idIndex !== -1)
                idsNotFound.splice(idIndex, 1);
            return idsNotFound.length === 0;
        });
    });

    /*
    patch(Player, 'computeItemSynergies').after(function() {
        const potentialSynergies = new Set();
        this.equipment.slotArray.forEach((slot)=>{
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
        game.enchanting.initMenus();
    });
}