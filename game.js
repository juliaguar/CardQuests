
var suits = ["yellow", "red", "blue", "green"]; // cool colors?
var numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]; // Is this nececarry?

var Card = function(suit, number) {
    this.suit = suit;
    this.number = number;
    this.create = function () {
        var suit = suits[Math.floor(Math.random()*suits.length)]; //selects a random suit
        var number = numbers[Math.floor(Math.random()*numbers.length)]; //asings a random number
        return new Card(suit, number);
    }; 
    this.combine = function(card) {
        // Maybe this should be a method of the deck instead
        if(this.suit === card.suit) {
            return new Card(this.suit, this.number + card.number);
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
    description: "7 Cards with same suit",
    checkCards: function(cards) {
        // Takes the cards selected for dropping
        if(cards.length < 7) return false;
        var suit = cards[0].suit;
        for(var i = 0; i < cards.length; i++) {
            if(cards[i].suit !== suit) {
                return false;
            }
        }
        return true;
    }
}

var Hand = function(table, player) {
    this.cards = [];
    this.player = player;
    this.table = table;
    this.phaseFinished = false; 
    
    this.cleanHand = function() {
        // Needs to be called at the end of the round
        var newArr = [];
        for(var i = 0; i < this.cards.length; i++) {
            if(this.cards[i]) {
                newArr.push(this.cards[i]);
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

    
    this.drawNewCard = function () {
        var card = (new Card()).create();
        this.cards.push(card);
        return card; 
    };
    
    // For the new hand
    for(var i = 0; i < 10; i++) {
        this.drawNewCard();
    }
    
    this.drawDiscardedCard = function () {
        if (this.table.discardedCards.length <= 0 ){
            return false
        } else {
            var card = this.table.discardedCards.pop();
            this.cards.push(card);
            return card;
        }
            
    };
    
    this.combineCards = function(cardspos) {
        var card1 = this.cards[ cardspos[0] ];
        var card2 = this.cards[ cardspos[1] ];
        var newCard = card1.combine(card2);
        // only combine if same suit
        if(newCard) {
            card2 = undefined;
            card1 = newCard;
            this.cleanHand();
            return card1;
        } else {
            return false;
        }
    };
    
    this.dropCard = function(pos) {
        // last move, drops a card on the discarded cards stack
        this.table.discardedCards.push(this.cards[pos]);
        this.cards[pos] = undefined;
        this.cleanHand(); 
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
    
    this.discardedCards = [(new Card()).create()];
    
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
    
    this.getCurrentPlayer = function() {
        return this.players[this.currentPlayerID];
    };
    
    this.nextPlayer = function() {
        this.currentPlayerID++;
        this.currentPlayerID %= this.players.length;
    };
    
    this.nextTurn = function () {
        
        //jquery rendering to show hand, the current player, the phase number and phase description
        $('#hand').html(""); 
        $('#player').text( this.getCurrentPlayer() );

        for (var i = 0; i < this.getCurrentPlayer().hand.cards.length; i++ ) {
            $('#hand').append("<li>" + this.getCurrentPlayer().hand.cards[i] + "</li>");
        }

        $('#phaseNumber').text(this.getCurrentPlayer().phase);
        $('#phaseDescription').text(phases[this.getCurrentPlayer().phase].description);
        

        // First: Drawing a card
        
        var input = false;
        var newOrOld = "";
        var newCard;
        while (!input) {
            newOrOld = prompt("Do you want a new card or the last card (" + this.table.lastDiscardedCard() + ")" );
            if (newOrOld === 'new') {
                newCard = this.getCurrentPlayer().hand.drawNewCard();
                input = true;
            } else if (newOrOld === 'last') {
                // If there is no discarded cards, input is false
                input = this.getCurrentPlayer().hand.drawDiscardedCard();
                newCard = input; 
            } 
        }

        // update displayed hand
        $('#hand').append('<li>' + newCard + '</li>');
        
        // Second: If not finished yet, give possibility to finish phase
        
        input = false;
        if (!this.getCurrentPlayer().hand.phaseFinished) {
            while(!input) {
                var finishPhase = prompt('Do you want to finish phase?');
                if (finishPhase === "yes") {
                    var cardsPositions = prompt('Please enter the cards positions you want to put on the table separated by spaces starting with 0 (from left to right)');
                    cardsPositions = cardsPositions.split(" ");
                    // TODO Check user input, if we want to continue having it text based
                    input = this.getCurrentPlayer().hand.finishPhase(cardsPositions);
                    if(input) {
                        alert("You have finished phase " + (this.getCurrentPlayer().phase - 1));
                        var newRound = prompt("Are you ready for a new round?")
                        if (newRound === "yes") {
                            this.newRound();
                        } else {
                            return;
                        }
                    } else {
                        alert("This way you can not finish the phase!");
                    }
                } else if (finishPhase === "no") {
                    alert("ok.");
                    input = true; 
                }
            }
        } else {
            // Third: Possibilty to drop further cards
            
            // TODO: Droping further cards to the cards on the table
        }
        
        // Fourth: Drop cards or combine cards
        
        input = false;
        while(!input) {
            var dropOrCombine = prompt("Do you want to drop [1] a card or combine two cards [2]?");
            if (dropOrCombine === "1") {
                var posCard = prompt("Enter position of card you want to drop: " + this.getCurrentPlayer().hand);
                this.getCurrentPlayer().hand.dropCard(posCard);
                input = true; 
            } else if (dropOrCombine === "2") {
                var selectCards = prompt("Please enter the cards positions you want to combine separated by spaces starting with 0 (from left to right): " + this.getCurrentPlayer().hand);
                selectCards = selectCards.split(" ");
                if (selectCards.length === 2){
                    this.getCurrentPlayer().hand.combineCards(selectCards);
                    input = true; 
                } else {
                    alert('Wrong number of cards.');
                }        
            }
        }
        
        this.nextPlayer();
        this.nextTurn(); //Continue :)
        
    };
    
    this.newRound = function() {
        // Start with an empty table
        this.table = new Table();
        
        // Initialize players hands and phases
        for(var i = 0; i < players.length; i++) {
            this.players[i].hand = new Hand(this.table, this.players[i]);
        }
        this.currentPlayerID = 0;
        
        // First turn
        this.nextTurn();
    };
    
    this.newRound(); // First round;
    
    
    
}


// Start the game


$(document).ready(function(){
    var names = prompt("What are the names of the players (separated by space)?");
    names = names.split(" ");
    var players = [];
    for (var i = 0; i < names.length; i++) {
        players.push(new Player(names[i]));
    }
    var game = new Game(players);
});
