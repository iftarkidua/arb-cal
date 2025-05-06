// State management
let state = {
  oddsFormat: 'decimal',
  investment: 100,
  bookmakers: [
    { id: 1, name: 'Bookmaker 1', odds: '', decimalOdds: 0 },
    { id: 2, name: 'Bookmaker 2', odds: '', decimalOdds: 0 }
  ],
  savedResults: []
};

// DOM Elements
const investmentInput = document.getElementById('investment');
const bookmakersContainer = document.getElementById('bookmakers-container');
const addBookmakerBtn = document.getElementById('add-bookmaker');
const resetBtn = document.getElementById('reset');
const calculateBtn = document.getElementById('calculate');
const resultContainer = document.getElementById('result-container');
const savedResultsContainer = document.getElementById('saved-results');
const oddsFormatButtons = document.querySelectorAll('.odds-format-selector button');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  renderBookmakers();
  updateCurrentYear();
  loadSavedResults();
});

// Event Listeners
investmentInput.addEventListener('change', (e) => {
  state.investment = Number(e.target.value);
});

addBookmakerBtn.addEventListener('click', addBookmaker);
resetBtn.addEventListener('click', resetCalculator);
calculateBtn.addEventListener('click', calculateArbitrage);

oddsFormatButtons.forEach(button => {
  button.addEventListener('click', () => {
    const format = button.dataset.format;
    setOddsFormat(format);
  });
});

// Functions
function renderBookmakers() {
  bookmakersContainer.innerHTML = state.bookmakers.map(bookmaker => `
    <div class="bookmaker-input" data-id="${bookmaker.id}">
      <input
        type="text"
        class="bookmaker-name"
        value="${bookmaker.name}"
        placeholder="Bookmaker name"
      >
      <input
        type="text"
        class="bookmaker-odds"
        value="${bookmaker.odds}"
        placeholder="${getOddsPlaceholder()}"
      >
      <button class="remove-bookmaker" ${state.bookmakers.length <= 2 ? 'disabled' : ''}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
  `).join('');

  // Add event listeners to new elements
  document.querySelectorAll('.bookmaker-name').forEach(input => {
    input.addEventListener('change', handleBookmakerNameChange);
  });

  document.querySelectorAll('.bookmaker-odds').forEach(input => {
    input.addEventListener('change', handleBookmakerOddsChange);
  });

  document.querySelectorAll('.remove-bookmaker').forEach(button => {
    button.addEventListener('click', handleRemoveBookmaker);
  });
}

function getOddsPlaceholder() {
  switch (state.oddsFormat) {
    case 'decimal': return '2.00';
    case 'fractional': return '1/1';
    case 'american': return '+100';
    default: return '2.00';
  }
}

function addBookmaker() {
  const newId = Math.max(...state.bookmakers.map(b => b.id)) + 1;
  state.bookmakers.push({
    id: newId,
    name: `Bookmaker ${newId}`,
    odds: '',
    decimalOdds: 0
  });
  renderBookmakers();
}

function handleBookmakerNameChange(e) {
  const bookmakerEl = e.target.closest('.bookmaker-input');
  const id = Number(bookmakerEl.dataset.id);
  const bookmaker = state.bookmakers.find(b => b.id === id);
  if (bookmaker) {
    bookmaker.name = e.target.value;
  }
}

function handleBookmakerOddsChange(e) {
  const bookmakerEl = e.target.closest('.bookmaker-input');
  const id = Number(bookmakerEl.dataset.id);
  const bookmaker = state.bookmakers.find(b => b.id === id);
  if (bookmaker) {
    bookmaker.odds = e.target.value;
    bookmaker.decimalOdds = convertToDecimal(e.target.value, state.oddsFormat);
  }
}

function handleRemoveBookmaker(e) {
  if (state.bookmakers.length <= 2) return;
  
  const bookmakerEl = e.target.closest('.bookmaker-input');
  const id = Number(bookmakerEl.dataset.id);
  state.bookmakers = state.bookmakers.filter(b => b.id !== id);
  renderBookmakers();
}

function setOddsFormat(format) {
  state.oddsFormat = format;
  oddsFormatButtons.forEach(button => {
    button.classList.toggle('active', button.dataset.format === format);
  });
  renderBookmakers();
}

function resetCalculator() {
  state.bookmakers = state.bookmakers.map(b => ({
    ...b,
    odds: '',
    decimalOdds: 0
  }));
  resultContainer.innerHTML = '';
  resultContainer.classList.add('hidden');
  renderBookmakers();
}

function calculateArbitrage() {
  const validBookmakers = state.bookmakers.filter(b => b.decimalOdds > 1);
  
  if (validBookmakers.length < 2 || state.investment <= 0) {
    showError('Please enter valid odds for at least two bookmakers and a positive investment amount.');
    return;
  }

  // Calculate implied probabilities
  const impliedProbabilities = validBookmakers.map(b => 1 / b.decimalOdds);
  const totalImpliedProbability = impliedProbabilities.reduce((sum, prob) => sum + prob, 0);
  
  // Check if arbitrage exists
  const isArbitrage = totalImpliedProbability < 1;
  
  // Calculate stakes and profit
  let stakes = validBookmakers.map(bookmaker => {
    const impliedProbability = 1 / bookmaker.decimalOdds;
    return (impliedProbability / totalImpliedProbability) * state.investment;
  });

  // Calculate profit
  const expectedPayout = validBookmakers[0].decimalOdds * stakes[0];
  const profit = expectedPayout - state.investment;
  const profitPercentage = (profit / state.investment) * 100;

  // Display results
  showResults({
    isArbitrage,
    totalImpliedProbability,
    profit,
    profitPercentage,
    stakes,
    bookmakers: validBookmakers
  });
}

function showResults(result) {
  const resultHtml = `
    <div class="result-container ${result.isArbitrage ? 'success' : 'error'}">
      <div class="result-header">
        ${result.isArbitrage 
          ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-success">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <path d="M22 4L12 14.01l-3-3"/>
            </svg>
            <h4>Arbitrage Opportunity Found!</h4>`
          : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-error">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <path d="M12 9v4"/>
              <path d="M12 17h.01"/>
            </svg>
            <h4>No Arbitrage Opportunity</h4>`
        }
      </div>
      
      <div class="result-grid">
        <div>
          <div class="result-stat">
            <div class="result-stat-label">Total Implied Probability</div>
            <div class="result-stat-value">
              ${(result.totalImpliedProbability * 100).toFixed(2)}%
              <span class="percentage">${result.isArbitrage ? '(< 100%)' : '(> 100%)'}</span>
            </div>
          </div>
          
          <div class="result-stat">
            <div class="result-stat-label">Profit</div>
            <div class="result-stat-value">
              $${result.profit.toFixed(2)}
              <span class="percentage">(${result.profitPercentage.toFixed(2)}%)</span>
            </div>
          </div>
          
          <div class="result-stat">
            <div class="result-stat-label">Total Investment</div>
            <div class="result-stat-value">$${state.investment.toFixed(2)}</div>
          </div>
        </div>
        
        <div>
          <div class="result-stat-label">Recommended Stakes</div>
          <div class="stakes-list">
            ${result.stakes.map((stake, index) => `
              <div class="stake-item">
                <div class="stake-item-details">
                  <div>${result.bookmakers[index].name}</div>
                  <div class="text-gray-500">@ ${result.bookmakers[index].decimalOdds.toFixed(2)}</div>
                </div>
                <div class="stake-item-amount">
                  <div>$${stake.toFixed(2)}</div>
                  <div class="stake-item-percentage">${((stake / state.investment) * 100).toFixed(1)}% of total</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      
      ${result.isArbitrage ? `
        <button class="save-opportunity primary-button mt-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          Save Opportunity
        </button>
      ` : `
        <div class="mt-4 p-3 bg-white border border-red-200 rounded text-sm text-gray-700">
          <p>To find arbitrage opportunities:</p>
          <ul class="list-disc pl-5 mt-2 space-y-1">
            <li>Look for odds that make the total implied probability less than 100%</li>
            <li>Compare more bookmakers to find better odds</li>
            <li>Focus on less popular markets where pricing inefficiencies are more common</li>
          </ul>
        </div>
      `}
    </div>
  `;

  resultContainer.innerHTML = resultHtml;
  resultContainer.classList.remove('hidden');

  // Add event listener for save button if it exists
  const saveButton = resultContainer.querySelector('.save-opportunity');
  if (saveButton) {
    saveButton.addEventListener('click', () => saveResult(result));
  }
}

function saveResult(result) {
  const savedResult = {
    id: Date.now(),
    ...result,
    investment: state.investment,
    timestamp: new Date().toISOString()
  };

  state.savedResults.push(savedResult);
  localStorage.setItem('savedResults', JSON.stringify(state.savedResults));
  renderSavedResults();
}

function loadSavedResults() {
  const saved = localStorage.getItem('savedResults');
  if (saved) {
    state.savedResults = JSON.parse(saved);
    renderSavedResults();
  }
}

function renderSavedResults() {
  if (state.savedResults.length === 0) {
    savedResultsContainer.innerHTML = `
      <div class="empty-state">
        <p>No saved opportunities yet.</p>
        <p class="subtitle">Calculate and save arbitrage opportunities to view them here.</p>
      </div>
    `;
    return;
  }

  savedResultsContainer.innerHTML = state.savedResults.map(saved => `
    <div class="saved-opportunity">
      <button class="delete-opportunity" data-id="${saved.id}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 6h18"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
      </button>
      
      <div class="flex justify-between items-center mb-2">
        <div class="font-medium">Investment: $${saved.investment.toFixed(2)}</div>
        <div class="text-sm px-2 py-1 rounded-full ${
          saved.isArbitrage 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }">
          ${saved.isArbitrage ? 'Arbitrage' : 'No Arbitrage'}
        </div>
      </div>
      
      <div class="text-sm font-medium">
        Profit: <span class="${saved.profit > 0 ? 'text-success' : 'text-error'}">
          $${saved.profit.toFixed(2)}
        </span>
        <span class="text-gray-500 text-xs ml-1">
          (${saved.profitPercentage.toFixed(2)}%)
        </span>
      </div>
      
      <div class="text-xs space-y-1 mt-2">
        ${saved.stakes.map((stake, index) => `
          <div class="flex justify-between border-t border-gray-100 pt-1">
            <span>${saved.bookmakers[index].name}:</span>
            <span class="font-medium">$${stake.toFixed(2)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  // Add event listeners for delete buttons
  document.querySelectorAll('.delete-opportunity').forEach(button => {
    button.addEventListener('click', (e) => {
      const id = Number(e.target.closest('.delete-opportunity').dataset.id);
      deleteResult(id);
    });
  });
}

function deleteResult(id) {
  state.savedResults = state.savedResults.filter(result => result.id !== id);
  localStorage.setItem('savedResults', JSON.stringify(state.savedResults));
  renderSavedResults();
}

function showError(message) {
  resultContainer.innerHTML = `
    <div class="result-container error">
      <div class="result-header">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-error">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        <h4>Error</h4>
      </div>
      <p>${message}</p>
    </div>
  `;
  resultContainer.classList.remove('hidden');
}

function updateCurrentYear() {
  document.getElementById('current-year').textContent = new Date().getFullYear();
}

// Odds conversion utilities
function convertToDecimal(odds, format) {
  if (!odds || odds.trim() === '') {
    return 0;
  }
  
  try {
    switch (format) {
      case 'decimal':
        return parseFloat(odds);
        
      case 'fractional':
        const parts = odds.split('/');
        if (parts.length !== 2) return 0;
        
        const numerator = parseFloat(parts[0]);
        const denominator = parseFloat(parts[1]);
        
        if (isNaN(numerator) || isNaN(denominator) || denominator === 0) {
          return 0;
        }
        
        return (numerator / denominator) + 1;
        
      case 'american':
        if (odds === '0') return 0;
        
        const value = parseInt(odds);
        if (isNaN(value)) return 0;
        
        if (value > 0) {
          return (value / 100) + 1;
        } else if (value < 0) {
          return (100 / Math.abs(value)) + 1;
        }
        return 0;
        
      default:
        return 0;
    }
  } catch (error) {
    console.error('Error converting odds:', error);
    return 0;
  }
}
