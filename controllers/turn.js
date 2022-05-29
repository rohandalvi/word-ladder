const fire = require('../common/firebase');
const firestore = fire.admin.firestore();

exports.flipTurn = async function(session_id) {

    var turn = await get_whose_turn(session_id);

    await firestore
    .collection('sessions')
    .doc(session_id)
    .update({'turn': turn ^ 1});
}

exports.whoseTurn = async function(session_id) {
    return await get_whose_turn(session_id);
}

/**
 * 
 * @param {*} session_id 
 * @returns 0 for agent, 1 for user
 */
async function get_whose_turn(session_id) {
    doc = await firestore
    .collection('sessions')
    .doc(session_id)
    .get();
    return doc.data().turn;
}