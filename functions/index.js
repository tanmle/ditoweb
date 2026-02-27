const functions = require('firebase-functions');
const admin = require('firebase-admin');
const moment = require('moment-timezone');

admin.initializeApp();

const getDayOfWeekNo = (ddd) => {
    switch (ddd) {
        case "Mon": return 1;
        case "Tue": return 2;
        case "Wed": return 3;
        case "Thu": return 4;
        case "Fri": return 5;
        case "Sat": return 6;
        case "Sun": return 7;
        default: return 0;
    }
}

/**
 * Scheduled function to create matches every Mon, Wed, Fri at 1 AM (Saigon time)
 */
exports.scheduledMatchCreation = functions.pubsub.schedule('0 1 * * Mon,Wed,Fri')
    .timeZone('Asia/Ho_Chi_Minh')
    .onRun(async (context) => {
        const targetMoment = moment().tz('Asia/Ho_Chi_Minh').add(1, 'day');

        const dateId = targetMoment.format('YYYYMMDD');
        const dowId = getDayOfWeekNo(targetMoment.format('ddd'));

        console.log(`Running scheduled match creation for ${dateId} (DOW: ${dowId})`);

        const playersRef = admin.database().ref('players');
        const matchPlayersRef = admin.database().ref(`matches/${dateId}/players`);

        // Check if match already exists to avoid overwriting manually created matches
        const existingMatchSnap = await admin.database().ref(`matches/${dateId}`).once('value');
        if (existingMatchSnap.exists()) {
            console.log(`Match ${dateId} already exists. Skipping automation.`);
            return null;
        }

        const playersSnap = await playersRef.once('value');
        const newMatchPlayers = {};

        playersSnap.forEach(playerSnap => {
            const player = playerSnap.val();
            const playerId = playerSnap.key;

            // Only include active players (status !== -1)
            if (parseInt(player.status) !== -1) {
                let isRegistered = false;
                
                // Check if player is set to play on this day of week
                if (player.dow && player.dow[dowId] === true) {
                    isRegistered = true;
                }

                newMatchPlayers[playerId] = {
                    isRegistered: isRegistered,
                    name: player.name,
                    isMatchPay: player.isMatchPay || 0,
                    penalty: '',
                    team: '',
                    avatar: player.avatar || ''
                };
            }
        });

        if (Object.keys(newMatchPlayers).length > 0) {
            await matchPlayersRef.set(newMatchPlayers);
            console.log(`Successfully created match for ${dateId} with ${Object.keys(newMatchPlayers).length} players.`);
        } else {
            console.log('No eligible players found. Match structure not created.');
        }

        return null;
    });

/**
 * HTTP function to manually trigger match creation for testing
 * Usage: https://<region>-<project-id>.cloudfunctions.net/manualCreateMatch?date=<YYYYMMDD>
 */
exports.manualCreateMatch = functions.https.onRequest(async (req, res) => {
    const targetDateStr = req.query.date || moment().format('YYYYMMDD');
    const targetMoment = moment.tz(targetDateStr, 'YYYYMMDD', 'Asia/Ho_Chi_Minh');
    const dowId = getDayOfWeekNo(targetMoment.format('ddd'));

    console.log(`Manually triggering match creation for ${targetDateStr} (DOW: ${dowId})`);

    const playersRef = admin.database().ref('players');
    const matchPlayersRef = admin.database().ref(`matches/${targetDateStr}/players`);

    const playersSnap = await playersRef.once('value');
    const newMatchPlayers = {};

    playersSnap.forEach(playerSnap => {
        const player = playerSnap.val();
        const playerId = playerSnap.key;

        if (parseInt(player.status) !== -1) {
            let isRegistered = false;
            if (player.dow && player.dow[dowId] === true) {
                isRegistered = true;
            }

            newMatchPlayers[playerId] = {
                isRegistered: isRegistered,
                name: player.name,
                isMatchPay: player.isMatchPay || 0,
                penalty: '',
                team: '',
                avatar: player.avatar || ''
            };
        }
    });

    if (Object.keys(newMatchPlayers).length > 0) {
        await matchPlayersRef.set(newMatchPlayers);
        res.status(200).send(`Successfully created match for ${targetDateStr} with ${Object.keys(newMatchPlayers).length} players.`);
    } else {
        res.status(200).send('No eligible players found.');
    }
});
