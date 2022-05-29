
const defaultStartingLives = 5;
const fire = require('../common/firebase');

const firestore = fire.admin.firestore();
exports.get_active_session = async function(phone_number)  {
    var snap = await firestore
    .collection('sessions')
    .where('active', '==', true)
    .where('phone_number', '==', phone_number)
    .get();

    if(snap.size == 1) {
      var docs = snap.docs[0];
        var activeSessionTimestamp = docs.data().lastUpdateTimeStamp;
        var currentTimestamp = fire.admin.firestore.Timestamp.now();
        if (currentTimestamp.seconds - activeSessionTimestamp.seconds <= 1800) {
          // if both requests are within 30 mins
          updateTimeStamp(docs.ref);
          return {
            'status': true,
            'session_id': docs.id
          }
        } else {
          // set active to false
          invalidateSession(docs.id);
        }
    } else if(snap.size > 1) {
      console.log("More than one active sessions found for "+phone_number+" "+snap.docs);
      console.log("Please investigate");
    }
    return {
      'status': false,
      'session_id': null
    };
};

updateTimeStamp = function(docRef) {
  return docRef.update({'lastUpdateTimeStamp': fire.admin.firestore.Timestamp.now()});
}

exports.invalidateSession = function(session_id) {
  return firestore.collection('sessions')
  .doc(session_id)
  .update({'active': false});
}

exports.create_new_session = async function(phone_number, session_id) {
  var doc = firestore.collection('sessions').doc(session_id);
  await doc.set({
    'active': true,
    'lastUpdateTimeStamp': fire.admin.firestore.Timestamp.now(),
    'phone_number': phone_number,
    'lives': defaultStartingLives,
    'turn': 0 // 0 is for agent, 1 is for user
  });
};

