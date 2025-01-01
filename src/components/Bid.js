import EventEmitter from "./EventEmitter";

export default class Bid {
  constructor(auctionId) {
    this._auctionId = auctionId;
    this._bids = [];
    this._highestBid = null;
    this._highestBidder = null;
    this._eventEmitter = new EventEmitter();
  }

  addBid(userId, amount) {
    const newBid = {
      userId,
      amount,
      timestamp: new Date().getTime()
    };
    this._bids.push(newBid);
    this._updateHighestBid(newBid);
    this._eventEmitter.emit("newBid", newBid);
  }

  _updateHighestBid(newBid) {
    if (!this._highestBid || newBid.amount > this._highestBid.amount) {
      this._highestBid = newBid;
      this._highestBidder = newBid.userId;
      this._eventEmitter.emit("newHighestBid", newBid);
    }
  }

  getBidCount() {
    return this._bids.length;
  }

  getHighestBid() {
    return this._highestBid;
  }

  getHighestBidder() {
    return this._highestBidder;
  }

  determineWinner() {
    return this._highestBidder;
  }

  on(eventName, callback) {
    this._eventEmitter.on(eventName, callback);
  }
}
