import { Fzf } from "https://esm.sh/fzf";

const searchItems = (searchText, menuItems) => {
    console.log("Searching");

    const fzf = new Fzf(menuItems.map(item => item.item_name));

    const matchedText = fzf.find(searchText);
    const matchedItems = matchedText.map(entry => entry.item);
    const matchedMenuItems = menuItems.filter(item => matchedItems.includes(item.item_name));


    console.log("Result:", matchedItems);

    return matchedMenuItems;
}

window.searchItems = searchItems;

console.log("search tool loaded");