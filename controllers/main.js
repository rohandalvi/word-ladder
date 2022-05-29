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
    if(status == true) {
        var t = await turn.whoseTurn(result.session_id);

        if(t == 0) {
            // if this was agent's turn, and user responded instead
            // send a response back to user informing it is not their turn.
            res.send('Not your turn').status(400);
        } else {
            // if this was user's turn, flip and make it agent's turn.
            turn.flipTurn(result.session_id);

            //validate word provided by user
            var isValidWordResponse = await game.isValidWord(word, result.session_id)

            if (isValidWordResponse.status == false) {
                var response = [];
                response.push(isValidWordResponse.error);
                // todo - decrement life
                await lifeCycle.decrement_life(result.session_id);
                var lives = await lifeCycle.get_balance_lives(result.session_id);
                var isAlive = lives > 0;
                if (!isAlive) {
                    response.push("You've run out of lives. Better luck, next time!");
                    session.invalidateSession(result.session_id);
                } else {
                    response.push("You have "+lives+" lives remaining. Pick your word wisely! :) ");
                }
                res.send(response.toString()).status(400);
            } else {
                // if valid word provided by user,
                // generate a new word from agent.
                // if no new word can be generated, user has won.
                // announce the winning to the user, in such case.
                
                var generateNextWordResponse = await game.generateNextWord(word, result.session_id);

                if(generateNextWordResponse.status == false) {
                    session.invalidateSession(result.session_id);
                }
                res.send(generateNextWordResponse.messages.toString()).status(200);

            }

            //finally, flip the turn back to user.
            turn.flipTurn(result.session_id);
        }
    } else {
        var session_id = uuidv4();  
        var response = [];
        await session.create_new_session(phone_number, session_id);
        await game.initializeGameSession(session_id);
        response.push(template.introTemplate);

        var generateNextWordResponse = await game.generateNextWord(null, session_id);
        turn.flipTurn(session_id);
        response.push(generateNextWordResponse.messages.toString());
        res.send(response.toString()).status(200);
    }

    // ------------------------------------------------
    // session
    // .get_active_session(phone_number)
    // .then((result) =>{

    //     var status = result.status;

    //     if(status == true) {
    //         // check if it was user's turn
    //         turn.whoseTurn(result.session_id)
    //         .then((t) => {

    //             if(t == 0) {
    //                 // if this was agent's turn, and user responded instead
    //                 // send a response back to user informing it is not their turn.
    //                 res.send('Not your turn').status(400);
    //             } else {
    //                 // if this was user's turn, flip and make it agent's turn.
    //                 turn.flipTurn(result.session_id);

    //                 //validate word provided by user
    //                 var isValidWordResponse = await game.isValidWord(word, result.session_id)

    //                 if (isValidWordResponse.status == false) {
    //                     var response = [];
    //                     response.push(isValidWordResponse.error);
    //                     // todo - decrement life
    //                     await lifeCycle.decrement_life(result.session_id);
    //                     var lives = await lifeCycle.get_balance_lives(result.session_id);
    //                     var isAlive = lives > 0;
    //                     if (!isAlive) {
    //                         response.push("You've run out of lives. Better luck, next time!");
    //                         session.invalidateSession(result.session_id);
    //                     } else {
    //                         response.push("You have "+lives+" lives remaining. Pick your word wisely! :) ");
    //                     }
    //                     res.send(response.toString()).status(400);
    //                 } else {
    //                     // if valid word provided by user,
    //                     // generate a new word from agent.
    //                     // if no new word can be generated, user has won.
    //                     // announce the winning to the user, in such case.
                        
    //                     var generateNextWordResponse = await game.generateNextWord(word, result.session_id);

    //                     if(generateNextWordResponse.status == false) {
    //                         session.invalidateSession(result.session_id);
    //                     }
    //                     res.send(generateNextWordResponse.messages.toString()).status(200);

    //                 }

    //                 //finally, flip the turn back to user.
    //                 turn.flipTurn(result.session_id);
    //             }
    //         });
    //     } else {
    //         var session_id = uuidv4();  
    //         var response = [];
    //         await session.create_new_session(phone_number, session_id, function(error) {
    //             if(error) {
    //                 console.log("Error when creating new session "+error);
    //                 response.push("Error when creating new session "+error);
    //             } else {
    //                 await game.initializeGameSession(session_id);
    //                 response.push(template.introTemplate);
    //             }
    //         }); 

    //         var generateNextWordResponse = await game.generateNextWord(null, result.session_id);
    //         turn.flipTurn(session_id);
    //         response.push(generateNextWordResponse.messages.toString());
    //         res.send(response.toString()).status(200);
    //     }
    
}