const fire = require('../common/firebase');
const firestore = fire.admin.firestore();

exports.addWordToWordsPlayedAndUpdateLastWord = async function(word, session_id) {
    var lastWordAndWordsPlayedObject = await getLastWordAndWordsPlayed(session_id);
    var wordsPlayed = lastWordAndWordsPlayedObject.words_played;

    wordsPlayed.push(word);
    await updateWordsPlayedAndLastWord(wordsPlayed, word, session_id);
}

exports.updateWordsPlayedAndLastWord = async function(wordsPlayed, lastWord, sessionId) {
    await updateWordsPlayedAndLastWord(wordsPlayed, lastWord, sessionId);
}

async function updateWordsPlayedAndLastWord(wordsPlayed, lastWord, sessionId) {
    await updateFirebase({'last_word': lastWord, 'words_played': wordsPlayed}, sessionId);
}
exports.initializeGameSession = async function(session_id) {

    var doc = firestore
    .collection('games')
    .doc(session_id);

    await doc
    .set({
        'last_word': null,
        'words_played': ["a"],
        'winner': null
    });
}

/**
 * 
 * @param {*} word 
 * Given a word and session id, generate the next sequence of word
 * in the ladder. 
 * If there is no word that can be generated, send appropriate response
 * that would be interpreted as a win for the user.
 */

exports.generateNextWord = async function(word, session_id) {
    if (word == null) {
        var firstWord = await getRandomWordFromDictionary();
        console.log("First word "+firstWord+" for session_id "+session_id);

        await updateWordsPlayedAndLastWord([firstWord], firstWord, session_id);
        
        return {
            'status': true,
            'messages': ["I'll start the game! Here's the first word", firstWord]
        };
    }
    
    var lastWordAndWordsPlayedObject = await getLastWordAndWordsPlayed(session_id);


   //todo - handle case for when word is null , 
   // in case of first time user session. 

   //todo- add the above use case here. 


   // all the words played until now
   var wordsPlayed = lastWordAndWordsPlayedObject.words_played;

   var wordMapData = await getWordFromDictionary(word);

   var wordMap = wordMapData.data();
    console.log("WordMap "+wordMap);
   for(const dictionaryWord in wordMap) {
       if (!arrayContainsWord(wordsPlayed, dictionaryWord)) {
           // we missed this. update the wordsPlayed array and add this new word
           wordsPlayed.push(dictionaryWord);
           await updateWordsPlayedAndLastWord(wordsPlayed, dictionaryWord, session_id);
           var definition = wordMap[dictionaryWord];
           return {
               'status': true,
               'messages': ['I pick '+dictionaryWord, 'It means '+definition]
           };
       }
   }

   /*
   //to-do: placeholder for calling points service to get points, in case user has won!
   */
   return {
       'status': false,
       'messages': ['You beat me! Congratulations! ']
   };
}

exports.isValidWord = async function(word, session_id) {

    var obj = await getLastWordAndWordsPlayed(session_id);
    var lastWord = obj['last_word'];
    var wordsPlayed = obj['words_played'];

    if(word.length != lastWord.length) {
        return {
            'status': false,
            'error': 'Invalid word'
        };
    }

    if(arrayContainsWord(wordsPlayed, word)) {
        return {
            'status': false,
            'error': 'This word is already played'
        };
    }
    var map = await getWordFromDictionary(lastWord);

    var wordsMap = map.data();

    for(var key in wordsMap) {
        if (key == word) {
            return {
                'status': true
            }
        }
    }
    return {
        'status': false,
        'error': 'This word does not exist in the dictionary'
    };
}

function arrayContainsWord(array, word) {

    for(const ar of array) {
        if (ar == word) return true;
    }
    return false;
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

async function getRandomWordFromDictionary() {
    var collection = await firestore.collection('dictionary').get();
    var randomIndex = Math.floor(Math.random() * collection.size);
    
    console.log("Random "+randomIndex);
    
    querySnapshot = await firestore.collection('dictionary')
    .offset(randomIndex)
    .limit(1)
    .get();

    return querySnapshot.docs[0].id;
}

async function getWordFromDictionary(word) {
    return firestore
    .collection('dictionary')
    .doc(word)
    .get();

}

async function updateFirebase(obj, session_id) {

    return await firestore
    .collection('games')
    .doc(session_id)
    .update(obj);
}