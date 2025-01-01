import EventEmitter from "./EventEmitter";
import Auction from "./Auction";
import Bid from "./Bid";

export default class AuctionManager {
  constructor() {
    this._auctions = {};
    this._eventEmitter = new EventEmitter();
  }

  createAuction(auctionId, startPrice, startTime, endTime) {
    const auction = new Auction(auctionId, startPrice, startTime, endTime);
    this._auctions[auctionId] = auction;
    auction.on("auctionEnded", this._handleAuctionEnd.bind(this));
    return auction;
  }

  getAuction(auctionId) {
    return this._auctions[auctionId];
  }

  _handleAuctionEnd(auctionId) {
    const auction = this._auctions[auctionId];
    const winner = auction.getWinner();
    this._eventEmitter.emit("auctionWinner", {
      auctionId,
      winnerId: winner.id
    });
  }

  on(eventName, callback) {
    this._eventEmitter.on(eventName, callback);
  }
}
