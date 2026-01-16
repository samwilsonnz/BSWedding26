// Generate Complete Grouping Report
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

function generateReport() {
    console.log('═'.repeat(80));
    console.log('                 COMPLETE WEDDING GUEST GROUPING REPORT');
    console.log('                    Sam & Beatrice\'s Wedding');
    console.log('═'.repeat(80));
    console.log();

    // Group by family_group
    const groupCounts = {};
    realGuests.forEach(g => {
        if (!groupCounts[g.family_group]) {
            groupCounts[g.family_group] = {
                members: [],
                side: g.side
            };
        }
        groupCounts[g.family_group].members.push(g.name);
    });

    // Summary statistics
    const totalGuests = realGuests.length;
    const brideCount = realGuests.filter(g => g.side === 'bride').length;
    const groomCount = realGuests.filter(g => g.side === 'groom').length;
    const totalGroups = Object.keys(groupCounts).length;

    console.log('📊 SUMMARY STATISTICS');
    console.log('─'.repeat(80));
    console.log(`Total Guests:          ${totalGuests}`);
    console.log(`Total Family Groups:   ${totalGroups}`);
    console.log(`Bride's Side:          ${brideCount} guests`);
    console.log(`Groom's Side:          ${groomCount} guests`);
    console.log();

    // GROOM'S SIDE
    console.log('═'.repeat(80));
    console.log('                          GROOM\'S SIDE (50 GUESTS)');
    console.log('═'.repeat(80));
    console.log();

    // Wilson Families
    console.log('┌─ WILSON FAMILIES (4 separate groups, 16 total guests)');
    console.log('│');
    const wilsonGroups = Object.keys(groupCounts)
        .filter(k => k.startsWith('wilson'))
        .sort();

    wilsonGroups.forEach((group, idx) => {
        const members = groupCounts[group].members;
        const isLast = idx === wilsonGroups.length - 1;
        const prefix = isLast ? '└──' : '├──';
        console.log(`${prefix} ${group.toUpperCase()} (${members.length} guests)`);
        members.forEach((member, mIdx) => {
            const isLastMember = mIdx === members.length - 1;
            const connector = isLast ? '    ' : '│   ';
            const memberPrefix = isLastMember ? '└──' : '├──';
            console.log(`${connector}${memberPrefix} ${member}`);
        });
        if (!isLast) console.log('│');
    });
    console.log();

    // Kane Families
    console.log('┌─ KANE FAMILIES (2 separate groups, 4 total guests)');
    console.log('│');
    const kaneGroups = Object.keys(groupCounts)
        .filter(k => k.startsWith('kane'))
        .sort();

    kaneGroups.forEach((group, idx) => {
        const members = groupCounts[group].members;
        const isLast = idx === kaneGroups.length - 1;
        const prefix = isLast ? '└──' : '├──';
        console.log(`${prefix} ${group.toUpperCase()} (${members.length} guests)`);
        members.forEach((member, mIdx) => {
            const isLastMember = mIdx === members.length - 1;
            const connector = isLast ? '    ' : '│   ';
            const memberPrefix = isLastMember ? '└──' : '├──';
            console.log(`${connector}${memberPrefix} ${member}`);
        });
        if (!isLast) console.log('│');
    });
    console.log();

    // Puha Families
    console.log('┌─ PUHA FAMILIES (2 separate groups, 4 total guests)');
    console.log('│');
    const puhaGroups = Object.keys(groupCounts)
        .filter(k => k.startsWith('puha'))
        .sort();

    puhaGroups.forEach((group, idx) => {
        const members = groupCounts[group].members;
        const isLast = idx === puhaGroups.length - 1;
        const prefix = isLast ? '└──' : '├──';
        console.log(`${prefix} ${group.toUpperCase()} (${members.length} guests)`);
        members.forEach((member, mIdx) => {
            const isLastMember = mIdx === members.length - 1;
            const connector = isLast ? '    ' : '│   ';
            const memberPrefix = isLastMember ? '└──' : '├──';
            console.log(`${connector}${memberPrefix} ${member}`);
        });
        if (!isLast) console.log('│');
    });
    console.log();

    // Other Groom's Side Groups
    console.log('┌─ OTHER GROOM\'S SIDE GROUPS (26 guests in 16 groups)');
    console.log('│');
    const otherGroomGroups = Object.keys(groupCounts)
        .filter(k => groupCounts[k].side === 'groom' &&
                     !k.startsWith('wilson') &&
                     !k.startsWith('kane') &&
                     !k.startsWith('puha'))
        .sort();

    otherGroomGroups.forEach((group, idx) => {
        const members = groupCounts[group].members;
        const isLast = idx === otherGroomGroups.length - 1;
        const prefix = isLast ? '└──' : '├──';
        console.log(`${prefix} ${group.toUpperCase()} (${members.length} ${members.length === 1 ? 'guest' : 'guests'})`);
        members.forEach((member, mIdx) => {
            const isLastMember = mIdx === members.length - 1;
            const connector = isLast ? '    ' : '│   ';
            const memberPrefix = isLastMember ? '└──' : '├──';
            console.log(`${connector}${memberPrefix} ${member}`);
        });
        if (!isLast) console.log('│');
    });
    console.log();

    // BRIDE'S SIDE
    console.log('═'.repeat(80));
    console.log('                          BRIDE\'S SIDE (19 GUESTS)');
    console.log('═'.repeat(80));
    console.log();

    // Billcliff Families
    console.log('┌─ BILLCLIFF FAMILIES (5 separate groups, 9 total guests)');
    console.log('│');
    const billcliffGroups = Object.keys(groupCounts)
        .filter(k => k.startsWith('billcliff'))
        .sort();

    billcliffGroups.forEach((group, idx) => {
        const members = groupCounts[group].members;
        const isLast = idx === billcliffGroups.length - 1;
        const prefix = isLast ? '└──' : '├──';
        const note = group === 'billcliff_parents' ? ' (Beatrice\'s parents)' : '';
        console.log(`${prefix} ${group.toUpperCase()}${note} (${members.length} ${members.length === 1 ? 'guest' : 'guests'})`);
        members.forEach((member, mIdx) => {
            const isLastMember = mIdx === members.length - 1;
            const connector = isLast ? '    ' : '│   ';
            const memberPrefix = isLastMember ? '└──' : '├──';
            console.log(`${connector}${memberPrefix} ${member}`);
        });
        if (!isLast) console.log('│');
    });
    console.log();

    // Other Bride's Side Groups
    console.log('┌─ OTHER BRIDE\'S SIDE GROUPS (10 guests in 5 groups)');
    console.log('│');
    const otherBrideGroups = Object.keys(groupCounts)
        .filter(k => groupCounts[k].side === 'bride' && !k.startsWith('billcliff'))
        .sort();

    otherBrideGroups.forEach((group, idx) => {
        const members = groupCounts[group].members;
        const isLast = idx === otherBrideGroups.length - 1;
        const prefix = isLast ? '└──' : '├──';
        console.log(`${prefix} ${group.toUpperCase()} (${members.length} ${members.length === 1 ? 'guest' : 'guests'})`);
        members.forEach((member, mIdx) => {
            const isLastMember = mIdx === members.length - 1;
            const connector = isLast ? '    ' : '│   ';
            const memberPrefix = isLastMember ? '└──' : '├──';
            console.log(`${connector}${memberPrefix} ${member}`);
        });
        if (!isLast) console.log('│');
    });
    console.log();

    // Group Size Distribution
    console.log('═'.repeat(80));
    console.log('                      GROUP SIZE DISTRIBUTION');
    console.log('═'.repeat(80));
    console.log();

    const sizeDist = {};
    Object.values(groupCounts).forEach(group => {
        const size = group.members.length;
        if (!sizeDist[size]) sizeDist[size] = 0;
        sizeDist[size]++;
    });

    Object.keys(sizeDist).sort((a, b) => b - a).forEach(size => {
        const count = sizeDist[size];
        const bar = '█'.repeat(count * 2);
        console.log(`${size} ${size === '1' ? 'guest ' : 'guests'}: ${bar} (${count} ${count === 1 ? 'group' : 'groups'})`);
    });

    console.log();
    console.log('═'.repeat(80));
    console.log('                            END OF REPORT');
    console.log('═'.repeat(80));
}

generateReport();
