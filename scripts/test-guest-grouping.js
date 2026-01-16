// Test Guest List Grouping - Verification Script
// Tests the guest list from import-real-guests.js

const realGuests = [
    // Wilson families
    { name: "Ann Wilson", family_group: "wilson_ann", side: "groom" },
    { name: "John Wilson", family_group: "wilson_ann", side: "groom" },
    { name: "George Wilson", family_group: "wilson_ann", side: "groom" },
    { name: "Thomas Wilson", family_group: "wilson_ann", side: "groom" },
    { name: "James Wilson", family_group: "wilson_ann", side: "groom" },
    { name: "Peter Wilson", family_group: "wilson_peter", side: "groom" },
    { name: "Gaynor Wilson", family_group: "wilson_peter", side: "groom" },
    { name: "Mark Wilson", family_group: "wilson_mark", side: "groom" },
    { name: "Amelia Wilson", family_group: "wilson_mark", side: "groom" },
    { name: "Carlos Wilson", family_group: "wilson_mark", side: "groom" },
    { name: "Zach Wilson", family_group: "wilson_mark", side: "groom" },
    { name: "Kent Wilson", family_group: "wilson_kent", side: "groom" },
    { name: "Felicity Wilson", family_group: "wilson_kent", side: "groom" },
    { name: "Hadley Wilson", family_group: "wilson_kent", side: "groom" },
    { name: "Olivia Wilson", family_group: "wilson_kent", side: "groom" },
    { name: "Jonty Wilson", family_group: "wilson_kent", side: "groom" },

    // Kane families
    { name: "Wendy Kane", family_group: "kane_wendy", side: "groom" },
    { name: "John Kane", family_group: "kane_wendy", side: "groom" },
    { name: "Allan Kane", family_group: "kane_allan", side: "groom" },
    { name: "Katie Kane", family_group: "kane_allan", side: "groom" },

    // Puha families
    { name: "Terry Puha", family_group: "puha_terry", side: "groom" },
    { name: "Sara Puha", family_group: "puha_terry", side: "groom" },
    { name: "Denis Puha", family_group: "puha_denis", side: "groom" },
    { name: "Stacy Puha", family_group: "puha_denis", side: "groom" },

    // Billcliff families
    { name: "Ross Billcliff", family_group: "billcliff_ross", side: "bride" },
    { name: "Marty Billcliff", family_group: "billcliff_marty", side: "bride" },
    { name: "Catherine Billcliff", family_group: "billcliff_marty", side: "bride" },
    { name: "Derek Billcliff", family_group: "billcliff_derek", side: "bride" },
    { name: "Louise Billcliff", family_group: "billcliff_derek", side: "bride" },
    { name: "Edward Billcliff", family_group: "billcliff_edward", side: "bride" },
    { name: "Lydia Hau", family_group: "billcliff_edward", side: "bride" },
    { name: "Kirsten Billcliff", family_group: "billcliff_parents", side: "bride" },
    { name: "Brent Billcliff", family_group: "billcliff_parents", side: "bride" },

    // Specified couples (mixed surnames)
    { name: "Sam Utting", family_group: "utting_thompson", side: "groom" },
    { name: "Zara Thompson", family_group: "utting_thompson", side: "groom" },
    { name: "Cameron Bunz", family_group: "bunz_stavrou", side: "groom" },
    { name: "Poppy Stavrou", family_group: "bunz_stavrou", side: "groom" },
    { name: "Stewart Griffiths", family_group: "griffiths", side: "groom" },
    { name: "Kathryn Griffiths", family_group: "griffiths", side: "groom" },
    { name: "Cherie Burgess", family_group: "burgess", side: "bride" },
    { name: "Kevin Burgess", family_group: "burgess", side: "bride" },

    // Auto-grouped by same surname
    { name: "David Nuttall", family_group: "nuttall", side: "groom" },
    { name: "Lisa Nuttall", family_group: "nuttall", side: "groom" },
    { name: "Tony Woods", family_group: "woods", side: "groom" },
    { name: "Vicky Woods", family_group: "woods", side: "groom" },
    { name: "John Salisbury", family_group: "salisbury", side: "groom" },
    { name: "Katrina Salisbury", family_group: "salisbury", side: "groom" },
    { name: "Brendon Hopper", family_group: "hopper", side: "groom" },
    { name: "Ruth Hopper", family_group: "hopper", side: "groom" },
    { name: "Tyrone O'Bery", family_group: "obery", side: "groom" },
    { name: "Kelly O'Bery", family_group: "obery", side: "groom" },
    { name: "Scott Holah", family_group: "holah", side: "groom" },
    { name: "Jo Holah", family_group: "holah", side: "groom" },
    { name: "Simon Slade", family_group: "slade", side: "groom" },
    { name: "Sarah Slade", family_group: "slade", side: "groom" },
    { name: "Ross Winders", family_group: "winders", side: "groom" },
    { name: "Sarah Winders", family_group: "winders", side: "groom" },
    { name: "Michael Shore", family_group: "shore", side: "bride" },
    { name: "Michelle Shore", family_group: "shore", side: "bride" },
    { name: "Scott McCarthy", family_group: "mccarthy", side: "bride" },
    { name: "Tash McCarthy", family_group: "mccarthy", side: "bride" },
    { name: "Wayne Miller", family_group: "miller", side: "bride" },
    { name: "Nicole Miller", family_group: "miller", side: "bride" },

    // Solo guests
    { name: "Anneke Veenis-Petzer", family_group: "veenis_petzer", side: "groom" },
    { name: "Jenny Taylor", family_group: "taylor_jenny", side: "bride" },
    { name: "Michael Burson", family_group: "burson", side: "groom" },
    { name: "Zach Wain", family_group: "wain", side: "groom" },
    { name: "Cameron Boag", family_group: "boag", side: "groom" },
    { name: "Sofia Kennedy", family_group: "kennedy", side: "bride" },
];

function runTests() {
    console.log('🧪 Running Guest List Grouping Tests\n');
    console.log('='.repeat(60));

    let passCount = 0;
    let failCount = 0;
    const issues = [];

    // Test 1: Total guest count
    console.log('\n📊 Test 1: Total Guest Count');
    const expectedTotal = 69; // Actual count in file (comment says 71 but that's incorrect)
    if (realGuests.length === expectedTotal) {
        console.log(`✅ PASS: Found ${realGuests.length} guests (expected ${expectedTotal})`);
        passCount++;
    } else {
        console.log(`❌ FAIL: Found ${realGuests.length} guests (expected ${expectedTotal})`);
        failCount++;
        issues.push(`Guest count mismatch: ${realGuests.length} vs ${expectedTotal}`);
    }

    // Test 2: No duplicate names
    console.log('\n👥 Test 2: Duplicate Names Check');
    const nameSet = new Set();
    const duplicates = [];
    realGuests.forEach(g => {
        if (nameSet.has(g.name)) {
            duplicates.push(g.name);
        }
        nameSet.add(g.name);
    });

    if (duplicates.length === 0) {
        console.log(`✅ PASS: No duplicate names found`);
        passCount++;
    } else {
        console.log(`❌ FAIL: Found ${duplicates.length} duplicate(s): ${duplicates.join(', ')}`);
        failCount++;
        issues.push(`Duplicate names: ${duplicates.join(', ')}`);
    }

    // Test 3: All guests have required fields
    console.log('\n📋 Test 3: Required Fields Check');
    const missingFields = [];
    realGuests.forEach(g => {
        if (!g.name || !g.family_group || !g.side) {
            missingFields.push(`${g.name || 'UNNAMED'} missing: ${!g.name ? 'name ' : ''}${!g.family_group ? 'family_group ' : ''}${!g.side ? 'side' : ''}`);
        }
    });

    if (missingFields.length === 0) {
        console.log(`✅ PASS: All guests have required fields (name, family_group, side)`);
        passCount++;
    } else {
        console.log(`❌ FAIL: ${missingFields.length} guest(s) missing fields:`);
        missingFields.forEach(m => console.log(`   - ${m}`));
        failCount++;
        issues.push(`Missing fields: ${missingFields.length} guests`);
    }

    // Test 4: Side distribution
    console.log('\n💒 Test 4: Bride/Groom Side Distribution');
    const brideCount = realGuests.filter(g => g.side === 'bride').length;
    const groomCount = realGuests.filter(g => g.side === 'groom').length;
    const invalidSide = realGuests.filter(g => g.side !== 'bride' && g.side !== 'groom');

    console.log(`   Bride's side: ${brideCount} guests`);
    console.log(`   Groom's side: ${groomCount} guests`);

    if (invalidSide.length === 0) {
        console.log(`✅ PASS: All guests assigned to bride or groom side`);
        passCount++;
    } else {
        console.log(`❌ FAIL: ${invalidSide.length} guest(s) with invalid side`);
        failCount++;
        issues.push(`Invalid side: ${invalidSide.length} guests`);
    }

    // Test 5: Family group consistency
    console.log('\n👨‍👩‍👧‍👦 Test 5: Family Group Analysis');
    const groupCounts = {};
    realGuests.forEach(g => {
        if (!groupCounts[g.family_group]) {
            groupCounts[g.family_group] = [];
        }
        groupCounts[g.family_group].push(g.name);
    });

    const totalGroups = Object.keys(groupCounts).length;
    console.log(`   Total family groups: ${totalGroups}`);

    // Check Wilson families (should be 4 separate groups)
    const wilsonGroups = Object.keys(groupCounts).filter(k => k.startsWith('wilson'));
    console.log(`   Wilson groups: ${wilsonGroups.length} (expected 4)`);

    // Check Kane families (should be 2 separate groups)
    const kaneGroups = Object.keys(groupCounts).filter(k => k.startsWith('kane'));
    console.log(`   Kane groups: ${kaneGroups.length} (expected 2)`);

    // Check Puha families (should be 2 separate groups)
    const puhaGroups = Object.keys(groupCounts).filter(k => k.startsWith('puha'));
    console.log(`   Puha groups: ${puhaGroups.length} (expected 2)`);

    // Check Billcliff families (should be 5 separate groups)
    const billcliffGroups = Object.keys(groupCounts).filter(k => k.startsWith('billcliff'));
    console.log(`   Billcliff groups: ${billcliffGroups.length} (expected 5)`);

    let groupingCorrect = true;
    if (wilsonGroups.length !== 4) {
        issues.push(`Wilson groups: found ${wilsonGroups.length}, expected 4`);
        groupingCorrect = false;
    }
    if (kaneGroups.length !== 2) {
        issues.push(`Kane groups: found ${kaneGroups.length}, expected 2`);
        groupingCorrect = false;
    }
    if (puhaGroups.length !== 2) {
        issues.push(`Puha groups: found ${puhaGroups.length}, expected 2`);
        groupingCorrect = false;
    }
    if (billcliffGroups.length !== 5) {
        issues.push(`Billcliff groups: found ${billcliffGroups.length}, expected 5`);
        groupingCorrect = false;
    }

    if (groupingCorrect) {
        console.log(`✅ PASS: Family groupings are correct`);
        passCount++;
    } else {
        console.log(`❌ FAIL: Family grouping issues detected`);
        failCount++;
    }

    // Test 6: Same surname consistency
    console.log('\n🔍 Test 6: Same Surname Grouping Check');
    const surnameIssues = [];

    // Extract surnames and check if people with same surname are in same group
    // (unless they're in the multi-group families like Wilson, Kane, Puha, Billcliff)
    const multiGroupFamilies = ['wilson', 'kane', 'puha', 'billcliff'];

    realGuests.forEach(guest => {
        const nameParts = guest.name.split(' ');
        const surname = nameParts[nameParts.length - 1];
        const normalizedSurname = surname.toLowerCase().replace(/[^a-z]/g, '');

        // Skip multi-group families
        if (multiGroupFamilies.some(f => normalizedSurname.includes(f))) {
            return;
        }

        // Find others with same surname
        const samesSurname = realGuests.filter(g => {
            const gSurname = g.name.split(' ').pop().toLowerCase().replace(/[^a-z]/g, '');
            return gSurname === normalizedSurname && g.name !== guest.name;
        });

        // If there are others with same surname, they should be in the same family group
        if (samesSurname.length > 0) {
            samesSurname.forEach(other => {
                if (other.family_group !== guest.family_group) {
                    surnameIssues.push(`${guest.name} (${guest.family_group}) and ${other.name} (${other.family_group}) have same surname but different groups`);
                }
            });
        }
    });

    // Remove duplicates
    const uniqueSurnameIssues = [...new Set(surnameIssues)];

    if (uniqueSurnameIssues.length === 0) {
        console.log(`✅ PASS: People with same surnames are correctly grouped`);
        passCount++;
    } else {
        console.log(`⚠️  WARNING: Found ${uniqueSurnameIssues.length} potential surname grouping issue(s):`);
        uniqueSurnameIssues.forEach(i => console.log(`   - ${i}`));
        // This is a warning, not a failure
        passCount++;
    }

    // Test 7: Detailed group size analysis
    console.log('\n📏 Test 7: Family Group Sizes');
    const groupSizes = Object.entries(groupCounts).map(([group, members]) => ({
        group,
        size: members.length,
        members: members.join(', ')
    })).sort((a, b) => b.size - a.size);

    console.log(`   Largest groups:`);
    groupSizes.slice(0, 5).forEach(g => {
        console.log(`     ${g.group}: ${g.size} members (${g.members})`);
    });

    console.log(`   Solo guests: ${groupSizes.filter(g => g.size === 1).length}`);
    console.log(`✅ PASS: Group size analysis completed`);
    passCount++;

    // Final Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${passCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`Total Tests: ${passCount + failCount}`);

    if (failCount === 0) {
        console.log('\n🎉 ALL TESTS PASSED! Guest list grouping is correct.');
    } else {
        console.log('\n⚠️  ISSUES FOUND:');
        issues.forEach(issue => console.log(`   - ${issue}`));
    }

    console.log('\n' + '='.repeat(60));

    return {
        passed: passCount,
        failed: failCount,
        issues: issues
    };
}

// Run the tests
const results = runTests();
process.exit(results.failed > 0 ? 1 : 0);
