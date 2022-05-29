const session = require('./session');
const { v4: uuidv4 } = require('uuid');
const turn = require('./turn');
const game = require('./game');
const lifeCycle = require('./lifeCycle');
var template = require('../common/template');

exports.handleMessage = async function(req, res) {

    var phone_number = req.body.number;
    var word = req.body.word;
    var result = await session
        .get_active_session(phone_number);
    var status = result.status;
    var session_id = result.session_id;
    var responses = [];
    if(status == true) {
        var t = await turn.whoseTurn(session_id);

        if(t == 0) {
            // if this was agent's turn, and user responded instead
            // send a response back to user informing it is not their turn.
            responses.push('Not your turn');
            // res.send('Not your turn').status(400);
        } else {
            // if this was user's turn, flip and make it agent's turn.
            turn.flipTurn(session_id);

            //validate word provided by user
            var isValidWordResponse = await game.isValidWord(word, session_id)

            if (isValidWordResponse.status == false) {
                var response = [];
                response.push(isValidWordResponse.error);
                // todo - decrement life
                await lifeCycle.decrement_life(session_id);
                var lives = await lifeCycle.get_balance_lives(session_id);
                var isAlive = lives > 0;
                if (!isAlive) {
                    response.push("You've run out of lives. Better luck, next time!");
                    await session.invalidateSession(session_id);
                } else {
                    response.push("You have "+lives+" lives remaining. Pick your word wisely! :) ");
                }
                responses.push(response.toString());
                // res.send(response.toString()).status(400);
            } else {
                // if valid word provided by user,
                // generate a new word from agent.
                // if no new word can be generated, user has won.
                // announce the winning to the user, in such case.
                
                await game.addWordToWordsPlayedAndUpdateLastWord(word, session_id);

                var generateNextWordResponse = await game.generateNextWord(word, session_id);

                if(generateNextWordResponse.status == false) {
                    await session.invalidateSession(session_id);
                }
                responses.push(generateNextWordResponse.messages.toString());
                // res.send(generateNextWordResponse.messages.toString()).status(200);
            }

            //finally, flip the turn back to user.
            await turn.flipTurn(session_id);

        }
    } else {
        session_id = uuidv4();  
       
        await session.create_new_session(phone_number, session_id);
        await game.initializeGameSession(session_id);
        responses.push(template.introTemplate);

        var generateNextWordResponse = await game.generateNextWord(null, session_id);
        turn.flipTurn(session_id);
        responses.push(generateNextWordResponse.messages.toString());
        // res.send(response.toString()).status(200);

    }   
    res.send(responses.toString()).status(200);
}

// function sendResponse(res, responses) {

//     res.send(responses.toString()).status(200);
// }