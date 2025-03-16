document.addEventListener('DOMContentLoaded', function() {
  // Retrieve leaderboard data from localStorage
  const leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
  
  // Make sure all entries have the required properties with default values
  leaderboard.forEach(entry => {
      entry.score = entry.score || 0;
      entry.stage = entry.stage || 1;
      entry.enemiesKilled = entry.enemiesKilled || 0;
  });
  
  // Set initial sort parameters
  let currentSort = 'score';
  let sortDirection = 'desc';
  
  // Function to display the leaderboard with current sorting
  function displayLeaderboard() {
      const leaderboardBody = document.getElementById('leaderboardBody');
      leaderboardBody.innerHTML = '';
      
      // Sort the leaderboard data
      const sortedLeaderboard = [...leaderboard].sort((a, b) => {
          // Handle text sorting for names
          if (currentSort === 'name') {
              if (sortDirection === 'asc') {
                  return a.name.localeCompare(b.name);
              } else {
                  return b.name.localeCompare(a.name);
              }
          } 
          // Handle numeric sorting for other fields
          else {
              const valueA = a[currentSort] || 0; // Default to 0 if property is missing
              const valueB = b[currentSort] || 0;
              
              if (sortDirection === 'asc') {
                  return valueA - valueB;
              } else {
                  return valueB - valueA;
              }
          }
      });
      
      // Display the sorted data
      sortedLeaderboard.forEach((entry, index) => {
          const row = document.createElement('tr');
          
          // Highlight top player by score regardless of current sort
          const topScorePlayer = leaderboard.reduce((prev, current) => 
              (prev.score > current.score) ? prev : current, {score: -1});
              
          if (entry.score === topScorePlayer.score) {
              row.classList.add('top-player');
          }
          
          row.innerHTML = `
              <td class="rank">${index + 1}</td>
              <td>${entry.name || 'Unknown'}</td>
              <td>${entry.score || 0}</td>
              <td>${entry.stage || 1}</td>
              <td>${entry.enemiesKilled || 0}</td>
          `;
          
          leaderboardBody.appendChild(row);
      });
      
      // If leaderboard is empty, show a message
      if (leaderboard.length === 0) {
          const row = document.createElement('tr');
          row.innerHTML = `
              <td colspan="5">No scores yet. Be the first to play!</td>
          `;
          leaderboardBody.appendChild(row);
      }
      
      // Update the active sort button
      document.querySelectorAll('.sort-btn').forEach(btn => {
          if (btn.dataset.sort === currentSort) {
              btn.classList.add('active');
          } else {
              btn.classList.remove('active');
          }
      });
      
      // Update column headers to show sort direction
      document.querySelectorAll('th[data-sort]').forEach(th => {
          th.classList.remove('sort-asc', 'sort-desc');
          if (th.dataset.sort === currentSort) {
              th.classList.add(sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
          }
      });
  }
  
  // Add click handlers for sort buttons
  document.querySelectorAll('.sort-btn').forEach(btn => {
      btn.addEventListener('click', function() {
          const sortBy = this.dataset.sort;
          
          if (currentSort === sortBy) {
              // Toggle direction if clicking the same column
              sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
          } else {
              // New column, set to descending by default
              currentSort = sortBy;
              sortDirection = 'desc';
          }
          
          displayLeaderboard();
      });
  });
  
  // Add click handlers for table headers
  document.querySelectorAll('th[data-sort]').forEach(th => {
      th.addEventListener('click', function() {
          const sortBy = this.dataset.sort;
          
          if (!sortBy) return; // Skip if no sort attribute
          
          if (currentSort === sortBy) {
              // Toggle direction if clicking the same column
              sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
          } else {
              // New column, set to descending by default
              currentSort = sortBy;
              sortDirection = 'desc';
          }
          
          displayLeaderboard();
      });
  });
  
  // Display the leaderboard on page load
  displayLeaderboard();
  
  // For testing - uncomment to view raw data in console
  // console.log('Leaderboard data:', leaderboard);
});