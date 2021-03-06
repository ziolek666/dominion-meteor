Inheritance = class Inheritance extends Event {

  coin_cost() {
    return 7
  }

  buy(game, player_cards) {
    let eligible_cards = _.filter(game.cards, function(card) {
      return card.count > 0 && card.top_card.purchasable && _.includes(_.words(card.top_card.types), 'action') && !_.includes(_.words(card.top_card.types), 'victory') && CardCostComparer.coin_less_than(game, card.top_card, 5)
    })

    if (_.size(eligible_cards) > 0) {
      let turn_event_id = TurnEventModel.insert({
        game_id: game._id,
        player_id: player_cards.player_id,
        username: player_cards.username,
        type: 'choose_cards',
        game_cards: true,
        instructions: 'Choose a card to set aside:',
        cards: eligible_cards,
        minimum: 1,
        maximum: 1
      })
      let turn_event_processor = new TurnEventProcessor(game, player_cards, turn_event_id)
      turn_event_processor.process(Inheritance.set_aside)
    } else {
      game.log.push(`&nbsp;&nbsp;but there are no available cards to set aside`)
    }
  }

  static set_aside(game, player_cards, selected_cards) {
    let stack_index = _.findIndex(game.cards, function(stack) {
      return stack.name === selected_cards[0].name
    })
    let inherited_card = game.cards[stack_index].top_card
    game.cards[stack_index].stack.shift()
    game.cards[stack_index].count -= 1
    if (game.cards[stack_index].count > 0) {
      game.cards[stack_index].top_card = _.head(game.cards[stack_index].stack)
    }
    player_cards.tokens.estate = selected_cards[0].top_card
    player_cards.estate.push(inherited_card)
    game.log.push(`&nbsp;&nbsp;<strong>${player_cards.username}</strong> sets aside ${CardView.render(inherited_card)} and sets their estate token on it`)
    Inheritance.convert_estates(game, player_cards)
  }

  static convert_estates(game, player_cards) {
    let inherited_estate = ClassCreator.create('Inherited Estate').to_h(player_cards)
    _.each(AllPlayerCardsQuery.card_sources(), function(source) {
      player_cards[source] = _.map(player_cards[source], function(card) {
        if (card.name === 'Estate') {
          return inherited_estate
        } else {
          return card
        }
      })
    })
  }
}
