
var suits = ["yellow", "red", "blue", "green"]; // cool colors?
var numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]; // Is this nececarry?

// Card model
var Card = function(suit, number, discardCard) {

    this.positionHand = -1;

    if(suit && number) {
        this.suit = suit;
        this.number = number;
    } else {
        this.suit = suits[Math.floor(Math.random()*suits.length)]; //selects a random suit
        this.number = numbers[Math.floor(Math.random()*numbers.length)]; //asings a random number
    }

    this.cardView = new CardView(this, 
        Math.floor(Math.random()*400) + 400, 
        Math.floor(Math.random()*400)
    );
    if(discardCard) {
        this.cardView.show();
        this.cardView.discardCard();
    }

    this.remove = function() {
        this.cardView.remove();
    }

    this.show= function() {
        this.cardView.show();
    }
    this.hide = function() {
        this.cardView.hide();
    }

    this.combine = function(card) {
        // Maybe this should be a method of the deck instead
        if(this.suit === card.suit) {
            var combined = new Card(this.suit, this.number + card.number);
            combined.hand = this.hand;
            return combined;
        } else {
            return false;
        }
    };
    
    this.toString = function() {
        return "Card " + this.number + " of color " + this.suit;
    };
}

var phases = [];

phases[0] = {
    description: "5 Cards with same suit",
    checkCards: function(cards) {
        // Takes the cards selected for dropping
        if(cards.length < 5) return false;
        var suit = cards[0].suit;
        for(var i = 0; i < cards.length; i++) {
            if(cards[i].suit !== suit) {
                return false;
            }
        }
        return true;
    }
}

phases[1] = {
    description: "1 Card with the number of 42",
    checkCards: function(cards) {
        return cards[0].number === 42;
    }
}

var Hand = function(table, player) {

    var _this = this;
    this.cards = [];
    this.player = player;
    this.table = table;
    this.phaseFinished = false; 
    
    this.cleanHand = function() {
        // Needs to be called at the end of the round
        var newArr = [];
        var newPos = 0;
        for(var i = 0; i < this.cards.length; i++) {
            if(this.cards[i]) {
                newArr[newPos] = this.cards[i];
                this.cards[i].positionHand = newPos;
                newPos++;
            }
        }
        this.cards = newArr;
    };
    
    // takes positions and returns the cards 
    this.positionsToCards = function(cardspos) {
        var cards = [];
        for(var i = 0; i < cardspos.length; i++) {
            cards.push(this.cards[cardspos[i]]);
        }
        return cards;
    };
    
    this.finishPhase = function(cardspos) {
        // finish the quest for this phase
        var selectedCards = this.positionsToCards(cardspos);
        if( phases[this.player.phase].checkCards(selectedCards) ) {
            for(var i = 0; i < cardspos.length; i++) {
                this.cards[ cardspos[i] ].remove();
                this.cards[ cardspos[i] ] = undefined; // droping the cards
            }
            this.phaseFinished = true;
            this.player.phase++; // Is it good to make it here?
            this.cleanHand();
            return true;
        } else {
            return false;
        }
    };

    this.showHand = function() {
        for(var i = 0; i < this.cards.length; i++) {
            this.cards[i].show();
        }
    }

    this.hideHand = function() {
        for(var i = 0; i < this.cards.length; i++) {
            this.cards[i].hide();
        }
    }

    this.removeHand = function() {
        for(var i = 0; i < this.cards.length; i++) {
            this.cards[i].remove();
        }
    }

    
    this.drawNewCard = function (visible) {
        var card = new Card();
        card.hand = _this;
        card.positionHand = this.cards.length; // combine in function! (see drawdiscarded cards)
        this.cards.push(card);
        if(visible) card.show();
        console.log(_this.cards.length);
        return card;
    };
    
    // For the new hand
    for(var i = 0; i < 10; i++) {
        this.drawNewCard(false);
    }
    

    this.drawDiscardedCard = function () {
        if(_this.cards.length <= 10) {
            if (_this.table.discardedCards.length <= 0 ){
                return false
            } else {
                var card = _this.table.discardedCards.pop();
                card.cardView.retake();
                card.positionHand = _this.cards.length;
                _this.cards.push(card);
                card.hand = _this;
                console.log(_this.cards.length);
                return card;
            }
        }
    };
    
    this.combineCards = function(cardspos) {
        var card1 = this.cards[ cardspos[0] ];
        var card2 = this.cards[ cardspos[1] ];
        var newCard = card1.combine(card2);
        // only combine if same suit
        if(newCard) {
            this.cards[ cardspos[1] ].remove();
            this.cards[ cardspos[0] ].remove();
            this.cards[ cardspos[1] ] = undefined;
            this.cards[ cardspos[0] ] = newCard;
            alert("Your new card is " + newCard);
            this.cleanHand();
            return card1;
        } else {
            return false;
        }
    };
    
    this.dropCard = function(pos) {
        // last move, drops a card on the discarded cards stack
        console.log("Dropping card " + this.cards[pos]);
        console.log(this.cards);
        if(this.cards.length > 10) {
            this.table.discardedCards.push(this.cards[pos]);
            //this.cards[pos].hide();
            this.cards[pos].cardView.discardCard();
            var oldCard = this.cards[pos];
            oldCard.cardView.setAction(_this.drawDiscardedCard);
            this.cards[pos] = undefined;
            this.cards.hand = undefined;
            this.cards.positionHand = undefined;
            this.cleanHand();

            game.nextTurn();
            console.log(this.cards.length);
            return true;
        } else {
            return false;
        }
    };
    
    this.toString = function() {
        var returnString = "";
        for(var i = 0; i < this.cards.length; i++) {
            returnString += i + ":" + this.cards[i] + "\n";
        }
        return returnString;
    };
}

var CardChain = function(cards, phase) {
    // cards which are layed out on the table
    
    this.cards = cards;
    this.phase = phase;
    
    this.addInFront = function (card) {
        var newArr = [];
        newArr[0] = card;
        for(var i = i; i <= cards.length; i++) {
            newArr.push(cards[i]);
        }
        if ( phases[this.phase].checkCards(newArr) ) {
            // checks if you are allowed to add the card 
            this.cards = newArr;
            return true;
        } else {
            return false;
        }
    };
    
    this.addToEnd = function (card) {
        this.cards.push(card);
        if( phases[this.phase].checkCards(this.cards) ) {
            return true;
        } else {
            this.cards.pop();
            return false;
        }
    };
    
};

var Table = function () {
    this.cardChains = []; // Arrays of sets of cards
    
    this.discardedCards = [];
    
    this.lastDiscardedCard = function() {
        return this.discardedCards[this.discardedCards.length - 1];
    };
    
    this.addCardChain = function(cardChain) {
        this.push(cardChain);
    };
};

var Player = function (name){
    this.phase = 0; // Start with zero
    this.hand = undefined;
    this.name = name;
    this.toString = function() {
        return this.name;
    };
};


var Game = function(players) {
    // Initialize table
    this.players = players;
    this.table;
    this.currentPlayerID;

    var _this = this;


    this.getCurrentPlayer = function() {
        return this.players[this.currentPlayerID];
    };
    
    this.nextPlayer = function() {
        this.currentPlayerID++;
        this.currentPlayerID %= this.players.length;
    };

    this.finishPhase = function() {
        if (!_this.getCurrentPlayer().hand.phaseFinished) {
                    var cardsPositions = prompt('Please enter the cards positions you want to put on the table separated by spaces starting with 0 (from left to right): '+ _this.getCurrentPlayer().hand)
                    cardsPositions = cardsPositions.split(" ");
                    // TODO Check user input, if we want to continue having it text based
                    input = _this.getCurrentPlayer().hand.finishPhase(cardsPositions);
                    if(input) {
                        alert("You have finished phase " + _this.getCurrentPlayer().phase);
                        var newRound = prompt("Are you ready for a new round?")
                        if (newRound === "yes") {
                            _this.newRound();
                        }
                    } else {
                        alert("This way you can not finish the phase!");
                    }
                }
    };


    this.combineCards = function() {
        if(_this.getCurrentPlayer().hand.cards.length > 10) {
            var selectCards = prompt("Please enter the cards positions you want to combine separated by spaces starting with 0 (from left to right): " + _this.getCurrentPlayer().hand);
            selectCards = selectCards.split(" ");
            if (selectCards.length === 2){
                input = _this.getCurrentPlayer().hand.combineCards(selectCards);
                // Next player
                _this.nextTurn(); //Continue :)
            } else {
                alert('Wrong number of cards.');
            }  
        } else {
            alert('You need to take a card first! You now have only ' + _this.getCurrentPlayer().hand.cards.length + ' cards');
        }
    }

    this.newCard = function() {
        if(_this.getCurrentPlayer().hand.cards.length <= 10) {
            _this.getCurrentPlayer().hand.drawNewCard(true);
        }
    };

    
    this.nextTurn = function () {

        if(_this.table.discardedCards.length < 1) {
            var newCard = new Card(false, false, true);
            newCard.cardView.setAction(_this.takeDiscardedCard);
            _this.table.discardedCards.push(newCard);
        }
        

        _this.getCurrentPlayer().hand.hideHand();
        _this.nextPlayer(); // This means right now the second player starts ;)

        // view, highlight current player
        console.log(this.playersLabel);
        playersLabel.highlightPlayer(this.currentPlayerID);
        
        // show phase and description
        setPhaseLabel(this.getCurrentPlayer().phase, phases[this.getCurrentPlayer().phase].description);

        this.getCurrentPlayer().hand.showHand();
        
        // RAPHAEL TESTING :D

        // var thecards = this.getCurrentPlayer().hand.cards;
        // for(var i = 0; i < thecards.length; i++){
        //     new CardView(thecards[i].suit, thecards[i].number, 110 * i, 330);
        // }



        // First: Drawing a card
        
        // var input = false;
        // var newOrOld = "";

        // var newCard;
        // while (!input) {
        //     newOrOld = prompt("Do you want a new card or the last card (" + this.table.lastDiscardedCard() + ")" );
        //     if (newOrOld === 'new') {
        //         newCard = this.getCurrentPlayer().hand.drawNewCard(true);
        //         input = true;
        //     } else if (newOrOld === 'last') {
        //         // If there is no discarded cards, input is false
        //         newCard = this.getCurrentPlayer().hand.drawDiscardedCard();
        //         input = newCard;
        //     } 
        // }

        //new CardView(newCard.suit, newCard.number, 10, 140);
        
        // Second: If not finished yet, give possibility to finish phase
        

        
        // Fourth: Drop cards or combine cards
        

        
    };
    
    this.newRound = function() {
        // Start with an empty table
        this.table = new Table();
        
        // Initialize players hands and phases
        for(var i = 0; i < players.length; i++) {
            if(this.players[i].hand) this.players[i].hand.removeHand();
            this.players[i].hand = new Hand(this.table, this.players[i]);
        }
        this.currentPlayerID = 0;
        
        // First turn
        this.nextTurn();
    };

    // Drawing the players List
    var playersLabel = new PlayerList(this.players);

    var deck = new Deck();
    deck.setAction(this.newCard);

    var droparea = new DropArea();
    

    // Drawing of buttons
    console.log(this.endTurn);
    var combineCardsButton = new Button("combine", 1, this.combineCards);
    var endPhaseButton = new Button("end phase", 2, this.finishPhase);


    this.newRound(); // First round;
    
    
    
    
}


// Start the game


var player1 = new Player('Julia');

var player2 = new Player('Finn');
var game = new Game([player1, player2]);



