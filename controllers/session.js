const { v4: uuidv4 } = require('uuid');
const defaultStartingLives = 5;
const fire = require('../common/firebase');
const game = require('./game');

const firestore = fire.admin.firestore();
exports.get_active_session = function(req, res)  {
    const phone_number = req.query.number;
    firestore
    .collection('sessions')
    .where('active', '==', true)
    .where('phone_number', '==', phone_number)
    .get()
    .then((snap) => {
      if(snap.size == 1) {
        // we should only find one, if more than one is active, then that's a bug.
        var docs = snap.docs[0];
        var activeSessionTimestamp = docs.data().lastUpdateTimeStamp;
        var currentTimestamp = fire.admin.firestore.Timestamp.now();

        if (currentTimestamp.seconds - activeSessionTimestamp.seconds <= 1800) {
          // if both requests are within 30 mins
          updateTimeStamp(docs.ref)
          .then((d) => res.send({'status': true, 'text': 'active session found', 'session_id': docs.id}).status(200));
        } else {
          // set active to false
          invalidateSession(docs.ref)
          .then((d) => res.send({'status': false, 'text': 'no active session found', 'session_id': null}).status(200));
        }
      } else if(snap.size > 1) {
        console.log("More than one active sessions found for "+phone_number+" "+snap.docs);
        console.log("Please investigate");
        res.send({'status': false, 'text': 'more than one session id found, please check logs', 'session_id': null}).status(200);
      } else {
        res.send({'status': false, 'text': 'no active session found', 'session_id': null}).status(200);
      }
    });
};

updateTimeStamp = function(docRef) {
  return docRef.update({'lastUpdateTimeStamp': fire.admin.firestore.Timestamp.now()});
}

invalidateSession = function(docRef) {
  return docRef.update({'active': false});
}

exports.create_new_session = function(req, res) {
  const phone_number = req.body.number;
  var doc = firestore.collection('sessions').doc(uuidv4());
  doc.set({
    'active': true,
    'lastUpdateTimeStamp': fire.admin.firestore.Timestamp.now(),
    'phone_number': phone_number,
    'lives': defaultStartingLives,
    'turn': 0 // 0 is for agent, 1 is for user
  }).then( () => {
    game.initializeGameSession(doc.id);
    res.send({'status': true, 'session_id': doc.id});
  }).catch((reject) => res.send({'status': false, 'session_id': null, 'msg': reject}).status(500));
};
