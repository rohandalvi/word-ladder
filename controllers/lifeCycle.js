const fire = require('../common/firebase');
const firestore = fire.admin.firestore();

exports.get_balance_lives = async function(session_id) {
    return await balance_lives(session_id);
}

exports.is_alive = async function(session_id) {
    return await balance_lives(session_id) > 0;
}

async function balance_lives(session_id) {
    doc = await firestore
    .collection('sessions')
    .doc(session_id)
    .get();

    return doc.data().lives;
}

exports.decrement_life = async function(session_id) {
    var lives = await balance_lives(session_id);

    await firestore.collection('sessions').doc(session_id).update({'lives': lives-1});
}