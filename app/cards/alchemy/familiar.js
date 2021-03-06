Familiar = class Familiar extends Card {

  types() {
    return ['action', 'attack']
  }

  coin_cost() {
    return 3
  }

  potion_cost() {
    return 1
  }

  play(game, player_cards) {
    let card_drawer = new CardDrawer(game, player_cards)
    card_drawer.draw(1)

    game.turn.actions += 1
    game.log.push(`&nbsp;&nbsp;<strong>${player_cards.username}</strong> gets +1 action`)

    let player_attacker = new PlayerAttacker(game, this)
    player_attacker.attack(player_cards)
  }

  attack(game, player_cards) {
    let card_gainer = new CardGainer(game, player_cards, 'discard', 'Curse')
    card_gainer.gain_game_card()
  }

}
