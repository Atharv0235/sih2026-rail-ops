const fs = require('fs');
const path = require('path');

const files = ['public/dashboard.html', 'public/backlog.html', 'public/planner.html', 'public/live.html'];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Dashboard style
  content = content.replace(/href="[^"]*"(?=[^<]*<i[^>]*data-feather="grid"[^>]*><\/i>\s*Dashboard)/gs, 'href="/dashboard"');
  content = content.replace(/href="[^"]*"(?=[^<]*<i[^>]*data-feather="list"[^>]*><\/i>\s*Task Backlog)/gs, 'href="/backlog"');
  content = content.replace(/href="[^"]*"(?=[^<]*<i[^>]*data-feather="calendar"[^>]*><\/i>\s*Block Planner)/gs, 'href="/planner"');
  content = content.replace(/href="[^"]*"(?=[^<]*<i[^>]*data-feather="map-pin"[^>]*><\/i>\s*Live Feed)/gs, 'href="/live"');

  // Backlog/Planner/Live style (Material Symbols)
  content = content.replace(/onclick="switchView\('[^']+'\)"/g, '');
  
  // Replace hrefs by looking ahead for the span with the correct text
  content = content.replace(/href="[^"]*"(?=\s*>\s*<span[^>]*>[^<]*<\/span>\s*<span[^>]*>Dashboard<\/span>)/gs, 'href="/dashboard"');
  content = content.replace(/href="[^"]*"(?=\s*>\s*<span[^>]*>[^<]*<\/span>\s*<span[^>]*>Task Backlog<\/span>)/gs, 'href="/backlog"');
  content = content.replace(/href="[^"]*"(?=\s*>\s*<span[^>]*>[^<]*<\/span>\s*<span[^>]*>Block Planner<\/span>)/gs, 'href="/planner"');
  content = content.replace(/href="[^"]*"(?=\s*>\s*<span[^>]*>[^<]*<\/span>\s*<span[^>]*>Live Feed<\/span>)/gs, 'href="/live"');

  // One more variant just in case (for the SVG/Feather style but different spacing)
  content = content.replace(/href="[^"]*"(?=\s*>\s*<span class="material-symbols-outlined[^>]*>dashboard<\/span>)/gs, 'href="/dashboard"');
  content = content.replace(/href="[^"]*"(?=\s*>\s*<span class="material-symbols-outlined[^>]*>list_alt<\/span>)/gs, 'href="/backlog"');
  content = content.replace(/href="[^"]*"(?=\s*>\s*<span class="material-symbols-outlined[^>]*>calendar_month<\/span>)/gs, 'href="/planner"');
  content = content.replace(/href="[^"]*"(?=\s*>\s*<span class="material-symbols-outlined[^>]*>sensors<\/span>)/gs, 'href="/live"');

  // Planner style might have "grid_view" for Dashboard
  content = content.replace(/href="[^"]*"(?=\s*>\s*<span[^>]*>grid_view<\/span>)/gs, 'href="/dashboard"');

  fs.writeFileSync(file, content);
});
console.log('Links updated thoroughly');
