const fire = require('../common/firebase');
const firestore = fire.admin.firestore();

exports.initializeGameSession = async function(session_id) {

    var doc = firestore
    .collection('games')
    .doc(session_id);
    doc
    .set({
        'last_word': null,
        'words_played': [],
        'winner': null
    }).then(() => {
        console.log(doc.id+" set");
    }).catch((reject) => {
        console.log("Error when pushing game session "+reject);
    });
}

async function getLastWordAndWordsPlayed(session_id) {
    var doc = await firestore
    .collection('games')
    .doc(session_id)
    .get();

    return {
        'last_word': doc.data().last_word,
        'words_played': doc.data().words_played
    };
}

async function getWordFromDictionary(word) {
    return firestore
    .collection('dictionary')
    .doc(word)
    .get();

}
exports.isValidWord = async function(word, session_id) {

    var obj = await getLastWordAndWordsPlayed(session_id);
    var lastWord = obj['last_word'];
    var wordsPlayed = obj['words_played'];

    if(word.length != lastWord.length) return false;

    for (const w of wordsPlayed) {
        if (w == word) return false;
    }

    map = await getWordFromDictionary(lastWord);

    words = map.data();

    for(var w in words) {
        console.log(words[w]);
    }
    return true;

}