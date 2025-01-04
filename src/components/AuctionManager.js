import EventEmitter from "./EventEmitter.js";
import Auction from "./Auction.js";

export default class AuctionManager {
  constructor(eventEmitter) {
    this._auctions = {};
    this._eventEmitter = eventEmitter;

    // Listen for auction events
    this._eventEmitter.on("auctionEnded", this.handleAuctionEnded.bind(this));
  }

  // Method to check for ended auctions
  checkAuctions() {
    for (const auctionId in this._auctions) {
      const auction = this._auctions[auctionId];
      if (auction.hasEnded()) {
        auction.endAuction(); // This will emit "auctionEnded" if successful
      }
    }
  }

  createAuction(auctionId, startPrice, startTime, endTime) {
    const auction = new Auction(
      auctionId,
      startPrice,
      startTime,
      endTime,
      this._eventEmitter
    );
    this._auctions[auctionId] = auction;

    return auction;
  }

  getAuction(auctionId) {
    return this._auctions[auctionId];
  }

  handleAuctionEnded({ auctionId, winnerId, winningAmount, sellerId }) {
    if (!winnerId) {
      console.log(`Auction ${auctionId} ended with no bids placed.`);
      return; // Exit if there is no winner
    }

    console.log(
      `Auction ${auctionId} has ended. Winner: ${winnerId} with bid $${winningAmount}`
    );

    // Notify seller (you may need to adjust how you access seller info)
    console.log(
      `Seller (ID: ${sellerId}) has been notified about the winning bid of $${winningAmount}.`
    );

    // Additional logic to handle auction end (e.g., updating UI, saving results)
  }

  on(eventName, callback) {
    this._eventEmitter.on(eventName, callback);
  }
}
