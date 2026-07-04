const fs = require('fs');
let content = fs.readFileSync('src/components/PositionSummaryModal.tsx', 'utf8');

content = content.replace(
  `tab === 'Investment' ? 'Investment History' : 'Summary'}`,
  `tab === 'Investment' ? 'Investment History' : \n               tab === 'Charts' ? 'Charts' : 'Summary'}`
);

fs.writeFileSync('src/components/PositionSummaryModal.tsx', content);
