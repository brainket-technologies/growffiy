const fs = require('fs');

const path = 'src/app/admin/strategies/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Find the Risk Management card block
const riskStartMatch = content.indexOf('{/* Risk Management */}');
if (riskStartMatch === -1) {
  console.log("Risk Management not found");
  process.exit(1);
}

// Risk Guard System ends right before '</div>' at line 2138
// But we need to find the exact end of its Card.
// The Card ends with </Card>.
const riskEndMatch = content.indexOf('</Card>', riskStartMatch) + 7;
const riskBlock = content.substring(riskStartMatch, riskEndMatch);

// Remove the risk block from its current place
content = content.substring(0, riskStartMatch) + content.substring(riskEndMatch);

// Find the end of the Left Column which is right before:
// {/* RIGHT: DYNAMIC CONDITION BUILDER & STOPLOSS/TARGET/RISK */}
const rightColumnStart = content.indexOf('{/* RIGHT: DYNAMIC CONDITION BUILDER & STOPLOSS/TARGET/RISK */}');
// Let's find the closing tag of the left column div right before this.
// We'll insert it right after the Dynamic Entry Conditions Card which ends with </Card> inside the left column.
const insertPos = content.lastIndexOf('</Card>', rightColumnStart) + 7;

// Insert the risk block at the end of the left column
content = content.substring(0, insertPos) + '\n\n              ' + riskBlock + content.substring(insertPos);

fs.writeFileSync(path, content, 'utf8');
console.log("Risk Guard System successfully moved to the left column!");
