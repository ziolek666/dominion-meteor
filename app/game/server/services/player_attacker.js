PlayerAttacker = class PlayerAttacker {

  constructor(game, card) {
    this.game = game
    this.card = card
  }

  attack() {
    let ordered_player_cards = TurnOrderedPlayerCardsQuery.turn_ordered_player_cards(this.game)
    ordered_player_cards.shift()

    _.each(ordered_player_cards, (attacked_player_cards) => {
      let reaction_processor = new ReactionProcessor(this.game, attacked_player_cards)
      reaction_processor.process_attack_reactions()

      if (attacked_player_cards.moat || this.lighthouse_in_play(attacked_player_cards)) {
        delete attacked_player_cards.moat
        this.game.log.push(`&nbsp;&nbsp;<strong>${attacked_player_cards.username}</strong> is immune to the attack`)
      } else {
        this.card.attack(this.game, attacked_player_cards)
      }
      Games.update(this.game._id, this.game)
      PlayerCards.update(attacked_player_cards._id, attacked_player_cards)
    })
  }

  lighthouse_in_play(player_cards) {
    return _.any(player_cards.duration, function(card) {
      return card.name === 'Lighthouse'
    })
  }
}