/**
 * FitTrack • Calorie & Macro Tracker
 * Pure Vanilla JavaScript • Persistent Browser Storage (localStorage)
 */

(function () {
  'use strict';

  // --- Constants & Storage Keys ---
  const STORAGE_KEYS = {
    DATA: 'fittrack_calorie_logs_v1',
    GOALS: 'fittrack_calorie_goals_v1'
  };

  const DEFAULT_GOALS = {
    calories: 2000,
    protein: 140, // grams
    carbs: 210,   // grams
    fat: 65       // grams
  };

  const PRESET_FOODS = [
    { name: 'Oatmeal & Almonds', calories: 320, protein: 11, carbs: 48, fat: 9, meal: 'Breakfast' },
    { name: '2 Boiled Eggs', calories: 156, protein: 12.6, carbs: 1.1, fat: 10.6, meal: 'Breakfast' },
    { name: 'Grilled Chicken (150g)', calories: 248, protein: 46.5, carbs: 0, fat: 5.4, meal: 'Lunch' },
    { name: 'Steamed Rice (1 cup)', calories: 205, protein: 4.2, carbs: 44.5, fat: 0.4, meal: 'Lunch' },
    { name: 'Salmon Fillet (150g)', calories: 312, protein: 30, carbs: 0, fat: 20, meal: 'Dinner' },
    { name: 'Mixed Green Salad', calories: 110, protein: 3, carbs: 8, fat: 8, meal: 'Dinner' },
    { name: 'Greek Yogurt (200g)', calories: 130, protein: 18, carbs: 6, fat: 3.5, meal: 'Snacks' },
    { name: 'Banana (Medium)', calories: 105, protein: 1.3, carbs: 27, fat: 0.3, meal: 'Snacks' },
    { name: 'Whey Protein Scoop', calories: 120, protein: 24, carbs: 2, fat: 1.5, meal: 'Snacks' },
    { name: 'Apple with Peanut Butter', calories: 210, protein: 5, carbs: 26, fat: 10, meal: 'Snacks' }
  ];

  // --- App State ---
  let appData = {
    logs: {} // format: { 'YYYY-MM-DD': [ { id, name, meal, calories, protein, carbs, fat, time } ] }
  };
  let appGoals = { ...DEFAULT_GOALS };
  let selectedDate = getTodayDateString();
  let editingItemId = null;

  // --- DOM Elements ---
  const el = {
    // Header & Date Nav
    prevDayBtn: document.getElementById('prev-day-btn'),
    nextDayBtn: document.getElementById('next-day-btn'),
    todayBtn: document.getElementById('today-btn'),
    datePicker: document.getElementById('date-picker'),
    dateDisplay: document.getElementById('date-display'),
    openGoalsBtn: document.getElementById('open-goals-btn'),
    openDataBtn: document.getElementById('open-data-btn'),

    // Hero Summary
    totalCaloriesNum: document.getElementById('total-calories-num'),
    remainingCaloriesNum: document.getElementById('remaining-calories-num'),
    calorieBalanceLabel: document.getElementById('calorie-balance-label'),
    calorieStatusPill: document.getElementById('calorie-status-pill'),
    calorieRingBar: document.getElementById('calorie-ring-bar'),
    gaugePercentage: document.getElementById('gauge-percentage'),
    calorieProgressBar: document.getElementById('calorie-progress-bar'),
    calorieGoalDisplay: document.getElementById('calorie-goal-display'),

    // Macros
    macroCaloriesSubtext: document.getElementById('macro-calories-subtext'),
    proteinConsumed: document.getElementById('protein-consumed'),
    proteinTarget: document.getElementById('protein-target'),
    proteinBar: document.getElementById('protein-bar'),
    proteinPct: document.getElementById('protein-pct'),
    proteinKcalSub: document.getElementById('protein-kcal-sub'),

    carbsConsumed: document.getElementById('carbs-consumed'),
    carbsTarget: document.getElementById('carbs-target'),
    carbsBar: document.getElementById('carbs-bar'),
    carbsPct: document.getElementById('carbs-pct'),
    carbsKcalSub: document.getElementById('carbs-kcal-sub'),

    fatConsumed: document.getElementById('fat-consumed'),
    fatTarget: document.getElementById('fat-target'),
    fatBar: document.getElementById('fat-bar'),
    fatPct: document.getElementById('fat-pct'),
    fatKcalSub: document.getElementById('fat-kcal-sub'),

    // Meals Column
    totalItemsBadge: document.getElementById('total-items-badge'),
    breakfastItems: document.getElementById('breakfast-items'),
    breakfastMeta: document.getElementById('breakfast-meta'),
    breakfastKcal: document.getElementById('breakfast-kcal'),

    lunchItems: document.getElementById('lunch-items'),
    lunchMeta: document.getElementById('lunch-meta'),
    lunchKcal: document.getElementById('lunch-kcal'),

    dinnerItems: document.getElementById('dinner-items'),
    dinnerMeta: document.getElementById('dinner-meta'),
    dinnerKcal: document.getElementById('dinner-kcal'),

    snacksItems: document.getElementById('snacks-items'),
    snacksMeta: document.getElementById('snacks-meta'),
    snacksKcal: document.getElementById('snacks-kcal'),

    // Form
    addFoodForm: document.getElementById('add-food-form'),
    formHeading: document.getElementById('form-heading'),
    editItemId: document.getElementById('edit-item-id'),
    foodName: document.getElementById('food-name'),
    foodMeal: document.getElementById('food-meal'),
    foodCalories: document.getElementById('food-calories'),
    foodProtein: document.getElementById('food-protein'),
    foodCarbs: document.getElementById('food-carbs'),
    foodFat: document.getElementById('food-fat'),
    saveFoodBtn: document.getElementById('save-food-btn'),
    cancelEditBtn: document.getElementById('cancel-edit-btn'),

    // Presets & History
    presetsGrid: document.getElementById('presets-grid'),
    historyChartWrapper: document.getElementById('history-chart-wrapper'),

    // Modals
    goalsModal: document.getElementById('goals-modal'),
    goalsForm: document.getElementById('goals-form'),
    goalCaloriesInput: document.getElementById('goal-calories-input'),
    goalProteinInput: document.getElementById('goal-protein-input'),
    goalCarbsInput: document.getElementById('goal-carbs-input'),
    goalFatInput: document.getElementById('goal-fat-input'),
    macroPreviewText: document.getElementById('macro-preview-text'),

    dataModal: document.getElementById('data-modal'),
    exportJsonBtn: document.getElementById('export-json-btn'),
    importJsonFile: document.getElementById('import-json-file'),
    clearDayBtn: document.getElementById('clear-day-btn'),
    resetAllBtn: document.getElementById('reset-all-btn'),

    toastContainer: document.getElementById('toast-container')
  };

  // --- Initialization ---
  function init() {
    loadData();
    populatePresets();
    setupEventListeners();
    updateDateDisplay();
    renderApp();
  }

  // --- Date Helpers ---
  function getTodayDateString() {
    const today = new Date();
    return formatDateString(today);
  }

  function formatDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function parseDateString(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function formatHumanDate(dateStr) {
    const todayStr = getTodayDateString();
    const dateObj = parseDateString(dateStr);

    // Check Yesterday / Today / Tomorrow
    const todayObj = parseDateString(todayStr);
    const diffTime = dateObj.getTime() - todayObj.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    const datePart = dateObj.toLocaleDateString('en-US', options);

    if (diffDays === 0) return `Today, ${datePart}`;
    if (diffDays === -1) return `Yesterday, ${datePart}`;
    if (diffDays === 1) return `Tomorrow, ${datePart}`;

    const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    return `${weekday}, ${datePart}`;
  }

  function shiftDate(days) {
    const currentDate = parseDateString(selectedDate);
    currentDate.setDate(currentDate.getDate() + days);
    selectedDate = formatDateString(currentDate);
    updateDateDisplay();
    renderApp();
  }

  function updateDateDisplay() {
    el.datePicker.value = selectedDate;
    el.dateDisplay.textContent = formatHumanDate(selectedDate);
  }

  // --- Local Storage Management ---
  function loadData() {
    try {
      const storedGoals = localStorage.getItem(STORAGE_KEYS.GOALS);
      if (storedGoals) {
        appGoals = { ...DEFAULT_GOALS, ...JSON.parse(storedGoals) };
      }

      const storedLogs = localStorage.getItem(STORAGE_KEYS.DATA);
      if (storedLogs) {
        appData = JSON.parse(storedLogs);
      } else {
        // Seed initial demo data for today so user starts with a populated view
        seedDemoData();
      }
    } catch (e) {
      console.error('Error loading data from localStorage', e);
      seedDemoData();
    }
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEYS.DATA, JSON.stringify(appData));
    } catch (e) {
      console.error('Failed to save logs to localStorage', e);
      showToast('Storage full or error saving data', 'error');
    }
  }

  function saveGoals() {
    try {
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(appGoals));
    } catch (e) {
      console.error('Failed to save goals', e);
    }
  }

  function seedDemoData() {
    const today = getTodayDateString();
    appData = {
      logs: {
        [today]: [
          {
            id: 'demo-1',
            meal: 'Breakfast',
            name: 'Avocado Toast & Poached Eggs',
            calories: 420,
            protein: 19,
            carbs: 34,
            fat: 24,
            time: '08:15'
          },
          {
            id: 'demo-2',
            meal: 'Lunch',
            name: 'Grilled Chicken & Quinoa Bowl',
            calories: 580,
            protein: 52,
            carbs: 60,
            fat: 14,
            time: '12:45'
          },
          {
            id: 'demo-3',
            meal: 'Snacks',
            name: 'Greek Yogurt with Blueberries',
            calories: 160,
            protein: 17,
            carbs: 14,
            fat: 3,
            time: '16:00'
          }
        ]
      }
    };
    saveData();
  }

  // --- Render Functions ---
  function renderApp() {
    const currentDayItems = appData.logs[selectedDate] || [];

    // Calculate totals
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    currentDayItems.forEach(item => {
      totalCalories += Number(item.calories) || 0;
      totalProtein += Number(item.protein) || 0;
      totalCarbs += Number(item.carbs) || 0;
      totalFat += Number(item.fat) || 0;
    });

    renderCalorieHero(totalCalories);
    renderMacros(totalProtein, totalCarbs, totalFat);
    renderMeals(currentDayItems);
    render7DayChart();
  }

  function renderCalorieHero(consumed) {
    const goal = Number(appGoals.calories) || 2000;
    const remaining = goal - consumed;
    const percentage = goal > 0 ? Math.round((consumed / goal) * 100) : 0;

    // Display numbers with commas
    el.totalCaloriesNum.textContent = consumed.toLocaleString();
    el.calorieGoalDisplay.textContent = `Goal: ${goal.toLocaleString()} kcal`;

    if (remaining >= 0) {
      el.calorieBalanceLabel.textContent = 'Remaining';
      el.remainingCaloriesNum.textContent = remaining.toLocaleString();
      el.remainingCaloriesNum.style.color = '#ffffff';

      if (percentage >= 95 && percentage <= 100) {
        el.calorieStatusPill.className = 'status-pill pill-warning';
        el.calorieStatusPill.textContent = 'Near Target';
      } else {
        el.calorieStatusPill.className = 'status-pill pill-normal';
        el.calorieStatusPill.textContent = 'On Track';
      }
    } else {
      el.calorieBalanceLabel.textContent = 'Over Budget';
      el.remainingCaloriesNum.textContent = Math.abs(remaining).toLocaleString();
      el.remainingCaloriesNum.style.color = '#f87171';
      el.calorieStatusPill.className = 'status-pill pill-over';
      el.calorieStatusPill.textContent = 'Over Budget';
    }

    // Circular Gauge
    const circumference = 2 * Math.PI * 50; // radius = 50 -> ~314.159
    const boundedPct = Math.min(percentage, 100);
    const strokeOffset = circumference - (boundedPct / 100) * circumference;

    el.calorieRingBar.style.strokeDashoffset = strokeOffset;
    el.gaugePercentage.textContent = `${percentage}%`;

    if (percentage > 100) {
      el.calorieRingBar.style.stroke = '#ef4444';
      el.calorieProgressBar.style.backgroundColor = '#ef4444';
    } else if (percentage >= 95) {
      el.calorieRingBar.style.stroke = '#f59e0b';
      el.calorieProgressBar.style.backgroundColor = '#f59e0b';
    } else {
      el.calorieRingBar.style.stroke = '#10b981';
      el.calorieProgressBar.style.backgroundColor = '#10b981';
    }

    // Linear bar
    el.calorieProgressBar.style.width = `${Math.min(percentage, 100)}%`;
  }

  function renderMacros(protein, carbs, fat) {
    const targetP = Number(appGoals.protein) || 140;
    const targetC = Number(appGoals.carbs) || 210;
    const targetF = Number(appGoals.fat) || 65;

    // Grams labels
    el.proteinConsumed.textContent = Math.round(protein * 10) / 10;
    el.proteinTarget.textContent = targetP;

    el.carbsConsumed.textContent = Math.round(carbs * 10) / 10;
    el.carbsTarget.textContent = targetC;

    el.fatConsumed.textContent = Math.round(fat * 10) / 10;
    el.fatTarget.textContent = targetF;

    // Percentages & Bars
    const pctP = targetP > 0 ? Math.round((protein / targetP) * 100) : 0;
    const pctC = targetC > 0 ? Math.round((carbs / targetC) * 100) : 0;
    const pctF = targetF > 0 ? Math.round((fat / targetF) * 100) : 0;

    el.proteinPct.textContent = `${pctP}%`;
    el.proteinBar.style.width = `${Math.min(pctP, 100)}%`;
    el.proteinKcalSub.textContent = `${Math.round(protein * 4)} kcal`;

    el.carbsPct.textContent = `${pctC}%`;
    el.carbsBar.style.width = `${Math.min(pctC, 100)}%`;
    el.carbsKcalSub.textContent = `${Math.round(carbs * 4)} kcal`;

    el.fatPct.textContent = `${pctF}%`;
    el.fatBar.style.width = `${Math.min(pctF, 100)}%`;
    el.fatKcalSub.textContent = `${Math.round(fat * 9)} kcal`;

    const totalMacroKcal = Math.round(protein * 4 + carbs * 4 + fat * 9);
    el.macroCaloriesSubtext.textContent = `${totalMacroKcal.toLocaleString()} kcal from macros`;
  }

  function renderMeals(items) {
    const mealContainers = {
      Breakfast: el.breakfastItems,
      Lunch: el.lunchItems,
      Dinner: el.dinnerItems,
      Snacks: el.snacksItems
    };

    const mealMetas = {
      Breakfast: el.breakfastMeta,
      Lunch: el.lunchMeta,
      Dinner: el.dinnerMeta,
      Snacks: el.snacksMeta
    };

    const mealKcals = {
      Breakfast: el.breakfastKcal,
      Lunch: el.lunchKcal,
      Dinner: el.dinnerKcal,
      Snacks: el.snacksKcal
    };

    const grouped = {
      Breakfast: [],
      Lunch: [],
      Dinner: [],
      Snacks: []
    };

    items.forEach(item => {
      const mealKey = item.meal || 'Snacks';
      if (grouped[mealKey]) {
        grouped[mealKey].push(item);
      } else {
        grouped.Snacks.push(item);
      }
    });

    el.totalItemsBadge.textContent = `${items.length} ${items.length === 1 ? 'item' : 'items'}`;

    ['Breakfast', 'Lunch', 'Dinner', 'Snacks'].forEach(meal => {
      const list = grouped[meal];
      const container = mealContainers[meal];
      const metaEl = mealMetas[meal];
      const kcalEl = mealKcals[meal];

      let mealCalories = 0;
      list.forEach(i => { mealCalories += Number(i.calories) || 0; });

      metaEl.textContent = `${list.length} ${list.length === 1 ? 'food' : 'foods'} • ${mealCalories.toLocaleString()} kcal`;
      kcalEl.textContent = `${mealCalories.toLocaleString()} kcal`;

      container.innerHTML = '';

      if (list.length === 0) {
        container.innerHTML = `<div class="empty-meal-state">No foods logged for ${meal.toLowerCase()}</div>`;
        return;
      }

      list.forEach(item => {
        const itemRow = document.createElement('div');
        itemRow.className = 'food-item-row';
        itemRow.dataset.id = item.id;

        const hasMacros = (item.protein > 0 || item.carbs > 0 || item.fat > 0);
        let macroTagsHtml = '';
        if (hasMacros) {
          macroTagsHtml = `
            <div class="food-item-macros">
              ${item.protein ? `<span class="macro-tag tag-p">P: ${item.protein}g</span>` : ''}
              ${item.carbs ? `<span class="macro-tag tag-c">C: ${item.carbs}g</span>` : ''}
              ${item.fat ? `<span class="macro-tag tag-f">F: ${item.fat}g</span>` : ''}
            </div>
          `;
        }

        itemRow.innerHTML = `
          <div class="food-item-info">
            <span class="food-item-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>
            ${macroTagsHtml}
          </div>
          <div class="food-item-right">
            <span class="food-item-calories">${Number(item.calories).toLocaleString()} kcal</span>
            <div class="food-item-actions">
              <button class="icon-btn edit-item-btn" title="Edit Item" data-id="${item.id}">✏️</button>
              <button class="icon-btn delete-btn delete-item-btn" title="Delete Item" data-id="${item.id}">🗑️</button>
            </div>
          </div>
        `;

        container.appendChild(itemRow);
      });
    });
  }

  function render7DayChart() {
    el.historyChartWrapper.innerHTML = '';

    const selectedObj = parseDateString(selectedDate);
    const daysToShow = 7;
    const dayDataList = [];
    let maxKcal = Number(appGoals.calories) || 2000;

    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date(selectedObj);
      d.setDate(d.getDate() - i);
      const dateKey = formatDateString(d);
      const dayItems = appData.logs[dateKey] || [];
      const dayKcal = dayItems.reduce((sum, item) => sum + (Number(item.calories) || 0), 0);

      if (dayKcal > maxKcal) maxKcal = dayKcal;

      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();

      dayDataList.push({
        dateKey,
        dayName,
        dayNum,
        kcal: dayKcal,
        isSelected: dateKey === selectedDate
      });
    }

    dayDataList.forEach(day => {
      const group = document.createElement('div');
      group.className = `chart-bar-group ${day.isSelected ? 'active-day' : ''}`;
      group.title = `${day.dayName} (${day.dateKey}): ${day.kcal} kcal (Goal: ${appGoals.calories})`;

      const pctHeight = maxKcal > 0 ? Math.min(Math.round((day.kcal / maxKcal) * 100), 100) : 0;
      const isOver = day.kcal > appGoals.calories;
      const barClass = isOver ? 'bar-over' : 'bar-under';

      group.innerHTML = `
        <div class="chart-bar-wrap">
          <div class="chart-bar-fill ${barClass}" style="height: ${pctHeight}%;"></div>
        </div>
        <span class="chart-bar-label">${day.dayName}<br>${day.dayNum}</span>
      `;

      group.addEventListener('click', () => {
        selectedDate = day.dateKey;
        updateDateDisplay();
        renderApp();
      });

      el.historyChartWrapper.appendChild(group);
    });
  }

  function populatePresets() {
    el.presetsGrid.innerHTML = '';
    PRESET_FOODS.forEach(preset => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'preset-chip';
      chip.innerHTML = `
        <span class="preset-name">${escapeHtml(preset.name)}</span>
        <span class="preset-info">${preset.calories} kcal • P: ${preset.protein}g</span>
      `;

      chip.addEventListener('click', () => {
        // Quick add this preset directly into the current selected date
        const targetMeal = el.foodMeal.value || preset.meal || 'Snacks';
        const newItem = {
          id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          name: preset.name,
          meal: targetMeal,
          calories: preset.calories,
          protein: preset.protein,
          carbs: preset.carbs,
          fat: preset.fat,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        if (!appData.logs[selectedDate]) {
          appData.logs[selectedDate] = [];
        }
        appData.logs[selectedDate].push(newItem);
        saveData();
        renderApp();
        showToast(`Added ${preset.name} to ${targetMeal}!`, 'success');
      });

      el.presetsGrid.appendChild(chip);
    });
  }

  // --- Food Form Actions (Add & Edit) ---
  function handleFormSubmit(e) {
    e.preventDefault();

    const name = el.foodName.value.trim();
    const meal = el.foodMeal.value;
    const calories = Number(el.foodCalories.value);
    const protein = parseFloat(el.foodProtein.value) || 0;
    const carbs = parseFloat(el.foodCarbs.value) || 0;
    const fat = parseFloat(el.foodFat.value) || 0;

    if (!name) {
      showToast('Please enter a food name', 'error');
      el.foodName.focus();
      return;
    }

    if (isNaN(calories) || calories < 0) {
      showToast('Please enter valid calories', 'error');
      el.foodCalories.focus();
      return;
    }

    if (!appData.logs[selectedDate]) {
      appData.logs[selectedDate] = [];
    }

    if (editingItemId) {
      // Update existing item
      const itemIndex = appData.logs[selectedDate].findIndex(i => i.id === editingItemId);
      if (itemIndex !== -1) {
        appData.logs[selectedDate][itemIndex] = {
          ...appData.logs[selectedDate][itemIndex],
          name,
          meal,
          calories,
          protein,
          carbs,
          fat
        };
        showToast(`Updated "${name}"`, 'success');
      }
      resetForm();
    } else {
      // Add new item
      const newItem = {
        id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        name,
        meal,
        calories,
        protein,
        carbs,
        fat,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      appData.logs[selectedDate].push(newItem);
      showToast(`Added "${name}" (${calories} kcal)`, 'success');
      resetForm(meal); // keep the selected meal for faster batch adding
    }

    saveData();
    renderApp();
  }

  function startEditItem(id) {
    const items = appData.logs[selectedDate] || [];
    const item = items.find(i => i.id === id);
    if (!item) return;

    editingItemId = id;
    el.formHeading.textContent = 'Edit Food Item';
    el.saveFoodBtn.textContent = 'Update Food';
    el.cancelEditBtn.style.display = 'inline-flex';

    el.foodName.value = item.name;
    el.foodMeal.value = item.meal;
    el.foodCalories.value = item.calories;
    el.foodProtein.value = item.protein || '';
    el.foodCarbs.value = item.carbs || '';
    el.foodFat.value = item.fat || '';

    // Scroll to form smoothly
    el.foodName.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.foodName.focus();
  }

  function deleteItem(id) {
    const items = appData.logs[selectedDate] || [];
    const item = items.find(i => i.id === id);
    const itemName = item ? item.name : 'Item';

    appData.logs[selectedDate] = items.filter(i => i.id !== id);

    if (editingItemId === id) {
      resetForm();
    }

    saveData();
    renderApp();
    showToast(`Removed "${itemName}"`, 'info');
  }

  function resetForm(keepMeal) {
    editingItemId = null;
    el.editItemId.value = '';
    el.formHeading.textContent = 'Log Food Item';
    el.saveFoodBtn.textContent = 'Add to Daily Log';
    el.cancelEditBtn.style.display = 'none';

    el.foodName.value = '';
    el.foodCalories.value = '';
    el.foodProtein.value = '';
    el.foodCarbs.value = '';
    el.foodFat.value = '';

    if (keepMeal) {
      el.foodMeal.value = keepMeal;
    }
  }

  // --- Goals Modal Handling ---
  function openGoalsModal() {
    el.goalCaloriesInput.value = appGoals.calories;
    el.goalProteinInput.value = appGoals.protein;
    el.goalCarbsInput.value = appGoals.carbs;
    el.goalFatInput.value = appGoals.fat;
    updateMacroPreview();
    openModal(el.goalsModal);
  }

  function updateMacroPreview() {
    const p = Number(el.goalProteinInput.value) || 0;
    const c = Number(el.goalCarbsInput.value) || 0;
    const f = Number(el.goalFatInput.value) || 0;

    const pKcal = p * 4;
    const cKcal = c * 4;
    const fKcal = f * 9;
    const total = pKcal + cKcal + fKcal;

    if (total > 0) {
      const pPct = Math.round((pKcal / total) * 100);
      const cPct = Math.round((cKcal / total) * 100);
      const fPct = Math.round((fKcal / total) * 100);
      el.macroPreviewText.textContent = `${pPct}% P / ${cPct}% C / ${fPct}% F (~${total} kcal)`;
    } else {
      el.macroPreviewText.textContent = 'Enter values above';
    }
  }

  function handleGoalsSubmit(e) {
    e.preventDefault();
    const calories = Number(el.goalCaloriesInput.value);
    const protein = Number(el.goalProteinInput.value);
    const carbs = Number(el.goalCarbsInput.value);
    const fat = Number(el.goalFatInput.value);

    if (calories < 500) {
      showToast('Daily calorie goal should be at least 500 kcal', 'error');
      return;
    }

    appGoals = { calories, protein, carbs, fat };
    saveGoals();
    closeModal(el.goalsModal);
    renderApp();
    showToast('Goals updated successfully!', 'success');
  }

  // --- Data Management (Export, Import, Clear) ---
  function exportData() {
    const exportPayload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      goals: appGoals,
      logs: appData.logs
    };

    const jsonString = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `fittrack_backup_${getTodayDateString()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast('Backup downloaded successfully', 'success');
  }

  function importData(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const imported = JSON.parse(event.target.result);
        if (imported && imported.logs) {
          appData.logs = imported.logs;
          if (imported.goals) {
            appGoals = { ...DEFAULT_GOALS, ...imported.goals };
            saveGoals();
          }
          saveData();
          renderApp();
          closeModal(el.dataModal);
          showToast('Data imported successfully!', 'success');
        } else {
          showToast('Invalid backup file structure', 'error');
        }
      } catch (err) {
        console.error('Import parse error', err);
        showToast('Failed to parse JSON file', 'error');
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  }

  function clearSelectedDay() {
    const count = (appData.logs[selectedDate] || []).length;
    if (count === 0) {
      showToast('No entries to clear for this date', 'info');
      return;
    }

    if (confirm(`Are you sure you want to delete all ${count} food item(s) for ${formatHumanDate(selectedDate)}?`)) {
      appData.logs[selectedDate] = [];
      saveData();
      renderApp();
      closeModal(el.dataModal);
      showToast('Entries cleared for selected day', 'info');
    }
  }

  function resetAllData() {
    if (confirm('WARNING: This will permanently delete ALL logged days, foods, and goals. Are you sure?')) {
      localStorage.removeItem(STORAGE_KEYS.DATA);
      localStorage.removeItem(STORAGE_KEYS.GOALS);
      appGoals = { ...DEFAULT_GOALS };
      appData = { logs: {} };
      saveGoals();
      saveData();
      renderApp();
      closeModal(el.dataModal);
      showToast('All data has been reset', 'info');
    }
  }

  // --- Modal Helpers ---
  function openModal(modalEl) {
    modalEl.classList.add('open');
  }

  function closeModal(modalEl) {
    modalEl.classList.remove('open');
  }

  // --- Toast Notifications ---
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;
    el.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    // Date Navigation
    el.prevDayBtn.addEventListener('click', () => shiftDate(-1));
    el.nextDayBtn.addEventListener('click', () => shiftDate(1));
    el.todayBtn.addEventListener('click', () => {
      selectedDate = getTodayDateString();
      updateDateDisplay();
      renderApp();
    });

    el.datePicker.addEventListener('change', (e) => {
      if (e.target.value) {
        selectedDate = e.target.value;
        updateDateDisplay();
        renderApp();
      }
    });

    // Form
    el.addFoodForm.addEventListener('submit', handleFormSubmit);
    el.cancelEditBtn.addEventListener('click', () => resetForm());

    // Quick add triggers on meal headers
    document.querySelectorAll('.quick-add-trigger').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const meal = e.currentTarget.dataset.targetMeal;
        el.foodMeal.value = meal;
        el.foodName.focus();
        el.foodName.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });

    // Delegated edit & delete clicks in meals container
    document.getElementById('meals-list-container').addEventListener('click', (e) => {
      const editBtn = e.target.closest('.edit-item-btn');
      if (editBtn) {
        const id = editBtn.dataset.id;
        startEditItem(id);
        return;
      }

      const deleteBtn = e.target.closest('.delete-item-btn');
      if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        deleteItem(id);
        return;
      }
    });

    // Goals Modal Events
    el.openGoalsBtn.addEventListener('click', openGoalsModal);
    el.goalsForm.addEventListener('submit', handleGoalsSubmit);
    ['goalCaloriesInput', 'goalProteinInput', 'goalCarbsInput', 'goalFatInput'].forEach(id => {
      el[id].addEventListener('input', updateMacroPreview);
    });

    // Data Modal Events
    el.openDataBtn.addEventListener('click', () => openModal(el.dataModal));
    el.exportJsonBtn.addEventListener('click', exportData);
    el.importJsonFile.addEventListener('change', importData);
    el.clearDayBtn.addEventListener('click', clearSelectedDay);
    el.resetAllBtn.addEventListener('click', resetAllData);

    // Modal close buttons (data-close-modal)
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modalId = e.currentTarget.getAttribute('data-close-modal');
        const modalEl = document.getElementById(modalId);
        if (modalEl) closeModal(modalEl);
      });
    });

    // Click outside modal card to close
    window.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        closeModal(e.target);
      }
    });

    // ESC key closes modals
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.open').forEach(modal => {
          closeModal(modal);
        });
      }
    });
  }

  // Run app on DOM loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

