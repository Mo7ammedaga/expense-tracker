// EXPENSE TRACKER - script.js
// Flow: user action -> update the expenses Array -> renderExpenses() (list, total, chart)
// 1. DOM SELECTION: each variable represents an HTML element
const expenseForm = document.querySelector('#expense-form'); // 1.1 the whole <form>
const amountInput = document.querySelector('#amount'); // 1.2 the amount <input>
const categoryInput = document.querySelector('#category'); // 1.3 the category <select>
const descriptionInput = document.querySelector('#description'); // 1.4 the description <input>
const expensesList = document.querySelector('#expenses-list'); // 1.5 the <ul> that shows the expenses
const totalExpenses = document.querySelector('#total-expenses'); // 1.6 the <p> that shows the total
const customCategoryField = document.querySelector('#custom-category-field'); // 1.7 the <div> around the custom category input
const customCategoryInput = document.querySelector('#custom-category'); // 1.8 the custom category <input>
const chartCanvas = document.querySelector('#expenseChart'); // 1.9 the <canvas> of the donut chart
const chartMessage = document.querySelector('#chart-message'); // 1.10 the <p> that shows a message instead of the chart

// 2. STATE: data that lives outside the functions
// 2.1 expenses represents all the saved expenses (each one is an Object)
let expenses = [];

// 2.2 editingExpenseId represents the id of the expense being edited (null = adding)
let editingExpenseId = null;

// 2.3 builtInCategories represents the categories that exist in the <select>
const builtInCategories = ['Food', 'Transport', 'Shopping', 'Bills'];

// 2.4 categoryChart represents the donut chart on the page (null = not drawn yet)
let categoryChart = null;

// 3. CUSTOM CATEGORY FIELD: shown only when 'Other' is selected
categoryInput.addEventListener('change', function () {
  // 3.1 show or hide the custom field
  customCategoryField.style.display =
    categoryInput.value === 'Other' ? 'block' : 'none';

  // 3.2 the custom field is required only for 'Other'
  customCategoryInput.required = categoryInput.value === 'Other';
});

// 4. FORM SUBMIT: runs when the user adds or saves an expense
expenseForm.addEventListener('submit', function (event) {
  // 4.1 stop the page from reloading
  event.preventDefault();

  // 4.2 read the values from the inputs
  const amount = Number(amountInput.value);
  const category = categoryInput.value;
  const description = descriptionInput.value;
  const customCategory = customCategoryInput.value;

  // 4.3 validate: alert and stop if the data is wrong
  if (amount <= 0) {
    alert('Please enter a valid amount');
    return;
  }
  if (category === '') {
    alert('Please select a category');
    return;
  }
  if (category === 'Other' && customCategory === '') {
    alert('Enter a custom category');
    return;
  }

  // 4.4 finalCategory represents the category we save (a custom one gets a capital first letter)
  const finalCategory =
    category === 'Other'
      ? customCategory.slice(0, 1).toUpperCase() +
        customCategory.slice(1).toLowerCase()
      : category;

  // 4.5 expense represents the new expense Object
  const expense = {
    amount: amount,
    category: finalCategory,
    description: description,
    id: editingExpenseId !== null ? editingExpenseId : Date.now(),
  };

  // 4.6 replace the expense being edited, or add a new one
  if (editingExpenseId !== null) {
    const selectedExpenseIndex = expenses.findIndex(function (existingExpense) {
      return existingExpense.id === editingExpenseId;
    });
    expenses[selectedExpenseIndex] = expense;
  } else {
    expenses.push(expense);
  }

  // 4.7 update the page
  renderExpenses();

  // 4.8 clean the form and leave edit mode
  editingExpenseId = null;
  expenseForm.reset();
  customCategoryField.style.display = 'none';
  customCategoryInput.required = false;
});

// 5. HELPERS: functions that prepare and draw the data
// 5.1 calculateTotal represents the rule reduce uses to add the amounts
const calculateTotal = (accumulator, expense) => accumulator + expense.amount;

// 5.2 getCategoryTotals represents the total of each category, e.g. { Food: 50, Gym: 20 }
const getCategoryTotals = function () {
  const categoryTotals = {};

  expenses.forEach(function (expense) {
    if (categoryTotals[expense.category] === undefined) {
      categoryTotals[expense.category] = 0;
    }

    categoryTotals[expense.category] =
      categoryTotals[expense.category] + expense.amount;
  });

  return categoryTotals;
};

// 5.3 renderChart represents the function that draws the donut (or shows a message)
const renderChart = function () {
  const categoryTotals = getCategoryTotals(); // categoryTotals represents the total of each category

  // remove the old chart before drawing a new one
  if (categoryChart !== null) {
    categoryChart.destroy();
  }

  let chartProblem = ''; // chartProblem represents why we cannot draw ('' = no problem)
  if (expenses.length === 0) {
    chartProblem = 'No expenses yet. Add one to see the chart.';
  } else if (typeof Chart === 'undefined') {
    chartProblem =
      'The chart could not be loaded. Check your internet connection.';
  }

  if (chartProblem !== '') {
    chartCanvas.style.display = 'none';
    chartMessage.textContent = chartProblem;
    chartMessage.style.display = 'block';
    return;
  }

  // no problem: hide the message and show the canvas
  chartMessage.style.display = 'none';
  chartCanvas.style.display = 'block';

  // draw the donut
  categoryChart = new Chart(chartCanvas, {
    type: 'doughnut',
    data: {
      labels: Object.keys(categoryTotals),
      datasets: [{ data: Object.values(categoryTotals) }],
    },
  });
};

// 6. RENDER EXPENSES: redraws the whole page from the expenses Array
const renderExpenses = function () {
  // 6.1 clear the list
  expensesList.innerHTML = '';

  // 6.2 total represents the sum of all amounts
  const total = expenses.reduce(calculateTotal, 0);
  totalExpenses.textContent = `${total} SAR`;

  // 6.3 build one list item per expense (currentExpense represents the expense in this turn)
  expenses.forEach(function (currentExpense) {
    const expenseItem = document.createElement('li'); // expenseItem represents the <li> of this expense

    // descriptionText represents the text after the category (empty if no description)
    const descriptionText =
      currentExpense.description === ''
        ? ''
        : ` -- ${currentExpense.description}`;

    expenseItem.textContent = `${currentExpense.amount} SAR -- ${currentExpense.category}
  ${descriptionText}`;

    // 6.4 deleteBtn represents the Delete button of this expense
    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('delete-btn');
    deleteBtn.textContent = 'Delete';
    deleteBtn.dataset.id = currentExpense.id;
    expenseItem.append(deleteBtn);
    deleteBtn.addEventListener('click', function () {
      const selectedId = Number(deleteBtn.dataset.id); // selectedId represents the id of the expense to delete
      // keep every expense except the deleted one
      expenses = expenses.filter(
        (existingExpense) => existingExpense.id !== selectedId,
      );

      // 6.4.9 if we deleted the expense being edited, leave edit mode
      if (selectedId === editingExpenseId) {
        editingExpenseId = null;
        expenseForm.reset();
        customCategoryField.style.display = 'none';
        customCategoryInput.required = false;
      }

      renderExpenses();
    });

    // 6.5 editBtn represents the Edit button of this expense
    const editBtn = document.createElement('button');
    editBtn.classList.add('edit-btn');
    editBtn.textContent = 'Edit';
    editBtn.dataset.id = currentExpense.id;
    expenseItem.append(editBtn);
    editBtn.addEventListener('click', function () {
      const selectedId = Number(editBtn.dataset.id); // selectedId represents the id of the expense to edit
      editingExpenseId = selectedId;

      // put the expense values back in the form
      amountInput.value = currentExpense.amount;
      descriptionInput.value = currentExpense.description;

      // built-in category: select it and hide the custom field
      if (builtInCategories.includes(currentExpense.category)) {
        categoryInput.value = currentExpense.category;
        customCategoryInput.value = '';
        customCategoryField.style.display = 'none';
        customCategoryInput.required = false;
      } else {
        // custom category: select Other and show the custom field
        categoryInput.value = 'Other';
        customCategoryField.style.display = 'block';
        customCategoryInput.value = currentExpense.category;
        customCategoryInput.required = true;
      }
    });

    // 6.6 put the list item on the page
    expensesList.append(expenseItem);
  });

  // 6.7 update the donut
  renderChart();
};

// 7. START: draw the chart once when the page opens
renderChart();
