import EventEmitter from "./EventEmitter.js";

export default class User {
  constructor(id, name, eventEmitter) {
    this._id = id;
    this._name = name;
    this._eventEmitter = eventEmitter;

    // Listen for auction win notifications
    this._eventEmitter.on("auctionWon", this.handleAuctionWin.bind(this));
  }

  get id() {
    return this._id;
  }

  get name() {
    return this._name;
  }

  placeBid(auctionId, amount) {
    // Emit an event for bid placement
    this._eventEmitter.emit("bidPlaced", {
      userId: this._id,
      auctionId: auctionId,
      amount: amount
    });
  }

  handleAuctionWin({ auctionId, winner }) {
    // Handle win notification logic
    if (winner.id === this._id) {
      console.log(
        `Congratulations ${this._name}! You have won the auction ${auctionId}.`
      );
    }
  }
}
