document.addEventListener('DOMContentLoaded', () => {
    // Screens and Sections
    const homeScreen = document.getElementById('home-screen');
    const mainAppContent = document.getElementById('main-app-content');
    const listSection = document.getElementById('list-section');
    const calculatorSection = document.getElementById('calculator-section');
    const receiptSection = document.getElementById('receipt-section'); // Get receipt screen

    // Buttons
    const startButton = document.getElementById('start-button');
    const backButton = document.getElementById('back-button');
    const showListButton = document.getElementById('show-list-button');
    const showCalculatorButton = document.getElementById('show-calculator-button');
    const itemInput = document.getElementById('item-input');
    const addButton = document.getElementById('add-button');
    const payButton = document.getElementById('pay-button');
    const newListButton = document.getElementById('new-list-button');

    // List
    const groceryList = document.getElementById('grocery-list');

    // Calculator UI
    const budgetInput = document.getElementById('budget-input');
    const totalCostDisplay = document.getElementById('total-cost-display');
    const remainingBudgetDisplay = document.getElementById('remaining-budget-display');
    // const calculatorInputs = document.getElementById('calculator-inputs'); // No longer needed for show/hide

    // Receipt UI
    const receiptContent = document.getElementById('receipt-content');

    // Local Storage Keys
    const ITEMS_STORAGE_KEY = 'groceryItems';
    const BUDGET_STORAGE_KEY = 'groceryBudget';

    // Initial Setup
    // Set initial screen states using classes
    homeScreen.classList.add('screen-visible');
    mainAppContent.classList.add('screen-hidden-right');
    receiptSection.classList.add('screen-hidden-below'); // Initially hidden below

    loadItems();
    loadBudget();
    updateCalculator();

    // --- Event Listeners ---

    // Start Button: Home -> Main App
    startButton.addEventListener('click', () => {
        homeScreen.classList.remove('screen-visible');
        homeScreen.classList.add('screen-hidden-left');
        mainAppContent.classList.remove('screen-hidden-right');
        mainAppContent.classList.add('screen-visible');
        showListSection(); // Default to list view in main app
    });

    // Back Button: Main App -> Home
    backButton.addEventListener('click', () => {
        mainAppContent.classList.remove('screen-visible');
        mainAppContent.classList.add('screen-hidden-right');
        homeScreen.classList.remove('screen-hidden-left');
        homeScreen.classList.add('screen-visible');
    });

    // Pay Button: Main App -> Receipt
    payButton.addEventListener('click', () => {
        const receiptText = generateReceiptText();
        receiptContent.textContent = receiptText;

        // Hide main app, show receipt screen
        mainAppContent.classList.remove('screen-visible');
        mainAppContent.classList.add('screen-hidden-right'); // Slide main app away
        receiptSection.classList.remove('screen-hidden-below');
        receiptSection.classList.add('screen-visible');
    });

    // New List Button: Receipt -> Home
    newListButton.addEventListener('click', () => {
        groceryList.innerHTML = '';
        saveItemsToStorage([]);
        budgetInput.value = '';
        saveBudget();
        updateCalculator();

        // Hide receipt, show home screen
        receiptSection.classList.remove('screen-visible');
        receiptSection.classList.add('screen-hidden-below');
        homeScreen.classList.remove('screen-hidden-left');
        homeScreen.classList.add('screen-visible');
    });

    // Show List Button (Operates within Main App)
    showListButton.addEventListener('click', showListSection);

    // Show Calculator Button (Operates within Main App)
    showCalculatorButton.addEventListener('click', showCalculatorSection);

    // Add item button
    addButton.addEventListener('click', addItem);

    // Add item with Enter key
    itemInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            addItem();
        }
    });

    // Handle list item clicks (complete/remove/quantity)
    groceryList.addEventListener('click', (event) => {
        const target = event.target;
        const li = target.closest('li');
        if (!li) return;

        if (target.classList.contains('complete-button')) {
            toggleComplete(li);
        } else if (target.classList.contains('remove-button')) {
            removeItem(li);
        } else if (target.classList.contains('quantity-up')) {
            changeQuantity(li, 1);
        } else if (target.classList.contains('quantity-down')) {
            changeQuantity(li, -1);
        }
    });

    // Update calculator when budget changes
    budgetInput.addEventListener('input', () => {
        saveBudget();
        updateCalculator();
    });

    // --- Functions ---

    // Controls view *within* mainAppContent
    function showListSection() {
        calculatorSection.style.display = 'none';
        listSection.style.display = 'flex'; // Use flex for list layout
        showListButton.classList.add('active');
        showCalculatorButton.classList.remove('active');
    }

    // Controls view *within* mainAppContent
    function showCalculatorSection() {
        listSection.style.display = 'none';
        calculatorSection.style.display = 'flex'; // Use flex for calc layout
        showCalculatorButton.classList.add('active');
        showListButton.classList.remove('active');
        updateCalculator();
        // Remove logic that showed/hid receipt section from here
    }

    function addItem() {
        const itemName = itemInput.value.trim();
        if (itemName === '') {
            alert('Please enter an item name.');
            return;
        }

        // Create item object with quantity
        const item = {
            id: Date.now(),
            name: itemName,
            price: null,
            quantity: 1, // Default quantity to 1
            completed: false
        };

        const liElement = createListItem(item);
        saveItemToStorage(item);
        itemInput.value = '';
        itemInput.focus();

        // Prompt for price (no change here)
        const priceInput = prompt(`Enter the price for "${itemName}" (leave blank or cancel for no price):`);
        if (priceInput !== null && priceInput.trim() !== '') {
            const price = parseFloat(priceInput);
            if (!isNaN(price) && price >= 0) {
                item.price = price;
                liElement.dataset.price = price;
                const itemNameSpan = liElement.querySelector('span.item-name');
                if (itemNameSpan) {
                    itemNameSpan.textContent = `${item.name} (RM${item.price.toFixed(2)})`;
                }
                updateItemPriceInStorage(item.id, item.price);
                updateCalculator();
            } else {
                alert('Invalid price entered. Please enter a valid number.');
            }
        }
    }

    function createListItem(item) {
        const li = document.createElement('li');
        li.dataset.id = item.id;
        // Ensure quantity is a valid number, default to 1
        const quantity = (item.quantity !== null && !isNaN(item.quantity) && item.quantity >= 1) ? item.quantity : 1;
        li.dataset.quantity = quantity; // Store validated quantity
        if (item.completed) {
            li.classList.add('completed');
        }
        if (item.price !== null) {
            li.dataset.price = item.price;
        }

        const itemNameSpan = document.createElement('span');
        itemNameSpan.classList.add('item-name');
        if (item.price !== null && !isNaN(item.price) && item.price >= 0) {
            itemNameSpan.textContent = `${item.name} (RM${item.price.toFixed(2)})`;
        } else {
            itemNameSpan.textContent = item.name;
        }

        // Controls Div
        const controlsDiv = document.createElement('div');
        controlsDiv.classList.add('item-controls');

        // --- Quantity Controls ---
        const quantityDownButton = document.createElement('button');
        quantityDownButton.classList.add('quantity-down');
        quantityDownButton.innerHTML = '&#8722;'; // Minus sign
        quantityDownButton.title = 'Decrease quantity';

        const quantityDisplay = document.createElement('span');
        quantityDisplay.classList.add('item-quantity');
        quantityDisplay.textContent = quantity; // Use validated quantity

        const quantityUpButton = document.createElement('button');
        quantityUpButton.classList.add('quantity-up');
        quantityUpButton.innerHTML = '&#43;'; // Plus sign
        quantityUpButton.title = 'Increase quantity';

        // --- Complete/Remove Controls ---
        const completeButton = document.createElement('button');
        completeButton.classList.add('complete-button');
        completeButton.innerHTML = '&#x2714;';
        completeButton.title = 'Mark as complete';

        const removeButton = document.createElement('button');
        removeButton.classList.add('remove-button');
        removeButton.innerHTML = '&#x2716;';
        removeButton.title = 'Remove item';

        // Add controls to the div
        controlsDiv.appendChild(quantityDownButton);
        controlsDiv.appendChild(quantityDisplay);
        controlsDiv.appendChild(quantityUpButton);
        controlsDiv.appendChild(completeButton);
        controlsDiv.appendChild(removeButton);

        li.appendChild(itemNameSpan);
        li.appendChild(controlsDiv);

        groceryList.appendChild(li);
        return li;
    }

    function toggleComplete(li) {
        li.classList.toggle('completed');
        // Update status in storage - price doesn't change completion status affects calculation
        updateItemStatusInStorage(li.dataset.id, li.classList.contains('completed'));
        updateCalculator(); // Recalculate when item is toggled
    }

    function removeItem(li) {
        const itemId = li.dataset.id;
        li.remove();
        deleteItemFromStorage(itemId);
        updateCalculator(); // Recalculate when item is removed
    }

    function changeQuantity(li, delta) {
        const currentQuantity = parseInt(li.dataset.quantity || '1');
        let newQuantity = currentQuantity + delta;

        if (newQuantity < 1) {
            newQuantity = 1; // Quantity cannot be less than 1
        }

        if (newQuantity !== currentQuantity) {
            li.dataset.quantity = newQuantity;
            const quantityDisplay = li.querySelector('.item-quantity');
            if (quantityDisplay) {
                quantityDisplay.textContent = newQuantity;
            }
            updateItemQuantityInStorage(li.dataset.id, newQuantity);
            updateCalculator(); // Recalculate cost
        }
    }

    // --- Calculator Functions ---

    function calculateTotalCost() {
        const items = getItemsFromStorage();
        let totalCost = 0;
        items.forEach(item => {
            if (!item.completed && item.price !== null && !isNaN(item.price)) {
                const quantity = item.quantity || 1;
                totalCost += item.price * quantity; // Multiply price by quantity
            }
        });
        return totalCost;
    }

    function updateCalculator() {
        const budget = parseFloat(budgetInput.value) || 0;
        const totalCost = calculateTotalCost();
        const remaining = budget - totalCost;

        totalCostDisplay.textContent = `RM${totalCost.toFixed(2)}`;
        remainingBudgetDisplay.textContent = `RM${remaining.toFixed(2)}`;

        // Optional: Style remaining budget based on value
        if (remaining < 0) {
            remainingBudgetDisplay.style.color = '#d9534f'; // Red if over budget
        } else {
            remainingBudgetDisplay.style.color = '#5cb85c'; // Green if within budget
        }
    }

    // --- Local Storage Functions ---

    function getItemsFromStorage() {
        const itemsJson = localStorage.getItem(ITEMS_STORAGE_KEY);
        return itemsJson ? JSON.parse(itemsJson) : [];
    }

    function saveItemsToStorage(items) {
        localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(items));
    }

    function loadItems() {
        const items = getItemsFromStorage();
        items.forEach(item => {
            // Ensure item has a valid quantity before creating list item
            if (item.quantity === null || isNaN(item.quantity) || item.quantity < 1) {
                item.quantity = 1; // Default to 1 if missing/invalid
            }
            createListItem(item);
        });
    }

    function saveItemToStorage(newItem) {
        const items = getItemsFromStorage();
        items.push(newItem);
        saveItemsToStorage(items);
    }

    function updateItemPriceInStorage(id, price) {
        const items = getItemsFromStorage();
        const itemIndex = items.findIndex(item => item.id == id);
        if (itemIndex > -1) {
            items[itemIndex].price = price;
            // items[itemIndex].quantity is preserved
            saveItemsToStorage(items);
        }
    }

    function updateItemStatusInStorage(id, completed) {
        const items = getItemsFromStorage();
        const itemIndex = items.findIndex(item => item.id == id);
        if (itemIndex > -1) {
            items[itemIndex].completed = completed;
            // items[itemIndex].quantity is preserved
            saveItemsToStorage(items);
        }
    }

    function deleteItemFromStorage(id) {
        let items = getItemsFromStorage();
        items = items.filter(item => item.id != id);
        saveItemsToStorage(items);
    }

    // Budget storage
    function saveBudget() {
        localStorage.setItem(BUDGET_STORAGE_KEY, budgetInput.value);
    }

    function loadBudget() {
        const savedBudget = localStorage.getItem(BUDGET_STORAGE_KEY);
        if (savedBudget) {
            budgetInput.value = savedBudget;
        }
    }

    // New function to update quantity in storage
    function updateItemQuantityInStorage(id, quantity) {
        const items = getItemsFromStorage();
        const itemIndex = items.findIndex(item => item.id == id);
        if (itemIndex > -1) {
            items[itemIndex].quantity = quantity;
            saveItemsToStorage(items);
        }
    }

    // Restore the generateReceiptText function
    function generateReceiptText() {
        let receipt = "================================\n";
        receipt += "        Grocery Receipt       \n";
        receipt += "================================\n\n";
        receipt += `${"Item".padEnd(20)} Qty  Price  Total\n`;
        receipt += `--------------------------------\n`;

        const items = getItemsFromStorage();
        let subtotal = 0;
        items.forEach(item => {
            if (!item.completed && item.price !== null && !isNaN(item.price)) {
                const quantity = item.quantity || 1;
                const price = item.price;
                const totalItemCost = price * quantity;
                subtotal += totalItemCost;

                const namePart = item.name.substring(0, 19).padEnd(20);
                const qtyPart = String(quantity).padStart(3);
                const pricePart = price.toFixed(2).padStart(7);
                const totalPart = totalItemCost.toFixed(2).padStart(7);

                receipt += `${namePart}${qtyPart}${pricePart}${totalPart}\n`;
            }
        });

        receipt += `--------------------------------\n`;
        receipt += `Subtotal:`.padEnd(30) + `RM${subtotal.toFixed(2).padStart(7)}\n`;
        const finalTotal = subtotal;
        receipt += `================================\n`;
        receipt += `TOTAL:`.padEnd(30) + `RM${finalTotal.toFixed(2).padStart(7)}\n`;
        receipt += `================================\n\n`;

        const budget = parseFloat(budgetInput.value) || 0;
        const remaining = budget - finalTotal;
        receipt += `Budget:`.padEnd(15) + `RM${budget.toFixed(2)}\n`;
        receipt += `Remaining:`.padEnd(15) + `RM${remaining.toFixed(2)}\n`;

        receipt += "\nThank you!\n";

        return receipt;
    }
}); 