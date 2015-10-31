CardPlayer = class CardPlayer {

  constructor(game, player_cards, card_name) {
    this.card = ClassCreator.create(card_name)
    this.game = game
    this.player_cards = player_cards
  }

  play(auto_update = true) {
    if (this.can_play()) {
      this.update_phase()
      this.put_card_in_play()
      this.use_action()
      if (auto_update) {
        this.update()
      }
      this.play_card()
      if (!auto_update) {
        return [this.game, this.player_cards]
      }
    }
  }

  play_multiple_times(times) {
    this.put_card_in_play()
    let card_play_list = _.times(times, (count) => {
      return Meteor.bindEnvironment(this.play_once.bind(this))
    })

    let start = Q.defer()

    _.reduce(card_play_list, (defer, card_play_action) => {
      let next_defer = Q.defer()
      defer.promise.then(Meteor.bindEnvironment(() => {
        card_play_action(next_defer)
      }))
      return next_defer
    }, start)

    start.resolve()
  }

  play_once(defer) {
    this.update()
    Q.when(this.play_card(), function() {
      defer.resolve()
    })
  }

  play_card() {
    return Q.when(this.card.play(this.game, this.player_cards), Meteor.bindEnvironment((result) => {
      return this.attack()
    }))
  }

  can_play() {
    return this.is_player_turn() && this.is_playable() && this.is_valid_play() && this.card_exists()
  }

  update_phase() {
    if (this.game.turn.phase == 'action' && _.contains(this.card.types(), 'treasure')) {
      this.game.turn.phase = 'treasure'
    }
  }

  put_card_in_play() {
    played_card = this.player_cards.hand.splice(this.card_index, 1)
    this.player_cards.in_play = this.player_cards.in_play.concat(played_card)
  }

  use_action() {
    if (_.contains(this.card.types(), 'action')) {
      this.game.turn.actions -= 1
    }
  }

  update() {
    this.update_log()
    Games.update(this.game._id, this.game)
    PlayerCards.update(this.player_cards._id, this.player_cards)
  }

  update_log() {
    this.game.log.push(`<strong>${Meteor.user().username}</strong> plays <span class="${this.card.type_class()}">${this.card.name()}</span>`)
  }

  is_player_turn() {
    return this.game.turn.player._id == Meteor.userId()
  }

  is_playable() {
    return typeof this.card.play === 'function'
  }

  is_valid_play() {
    if (_.contains(this.card.types(), 'action')) {
      return this.is_valid_action()
    } else if (_.contains(this.card.types(), 'treasure')) {
      return this.is_valid_treasure()
    }
  }

  is_valid_action() {
    return this.game.turn.phase == 'action' && this.game.turn.actions > 0
  }

  is_valid_treasure() {
    return _.contains(['action', 'treasure'], this.game.turn.phase)
  }

  card_exists() {
    this.card_index = _.findIndex(this.player_cards.hand, (card) => {
      return card.name === this.card.name()
    })
    return this.card_index !== -1
  }

  attack() {
    if (_.contains(this.card.types(), 'attack')) {
      let turn_ordered_players = TurnOrderedPlayersQuery.turn_ordered_players(this.game, Meteor.user())
      return Q.all(_.map(turn_ordered_players, Meteor.bindEnvironment((player) => {
        return this.card.attack(this.game, player)
      })))
    }
  }

}
