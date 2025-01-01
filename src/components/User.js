import EventEmitter from "./EventEmitter";

export default class User {
  constructor(id, name) {
    this._id = id;
    this._name = name;
    this._bids = {};
    this._eventEmitter = new EventEmitter();
  }

  get id() {
    return this._id;
  }
  get name() {
    return this._name;
  }

  placeBid(auctionManager, auctionId, amount) {
    const auction = auctionManager.getAuction(auctionId);
    if (!auction) {
      throw new Error("Auction not found");
    }
    console.log("Auction start time:", new Date(auction._startTime));
    console.log("Auction end time:", new Date(auction._endTime));
    console.log("Current time:", new Date());
    console.log("Is auction active?", auction.isActive());

    if (!auction.isActive()) {
      throw new Error("Auction has ended or not started yet");
    }

    const currentBid = this.getCurrentBidForAuction(auctionId);
    if (currentBid && amount <= currentBid.amount) {
      throw new Error("New bid must be higher than current bid");
    }

    const newBid = {
      amount: amount,
      timestamp: new Date().getTime()
    };

    if (!this._bids[auctionId]) {
      this._bids[auctionId] = [];
    }
    this._bids[auctionId].push(newBid);

    auction.placeBid(this._id, amount);
    this._eventEmitter.emit("bidPlaced", {
      userId: this._id,
      auctionId,
      bid: newBid
    });
  }

  getCurrentBidForAuction(auctionId) {
    const bids = this._bids[auctionId];
    return bids ? bids[bids.length - 1] : null;
  }

  getBidHistory(auctionId) {
    return this._bids[auctionId] || [];
  }

  onWinNotification(callback) {
    this._eventEmitter.on("auctionWon", callback);
  }
}
