import EventEmitter from "./EventEmitter";
import Bid from "./Bid";

export default class Auction extends EventEmitter {
  constructor(auctionId, startPrice, startTime, endTime) {
    super();
    this._auctionId = auctionId;

    this._startPrice = startPrice;
    this._bids = {};
    this._highestBid = startPrice;
    this._highestBidder = null;
    this._startTime = startTime;
    this._endTime = endTime;
    this._bidManager = new Bid(auctionId);
    this._bidManager.on("newHighestBid", this._onNewHighestBid.bind(this));
  }
  get user() {
    return this._user;
  }
  get auctionId() {
    return this._auctionId;
  }
  get highestBid() {
    return this._highestBid;
  }
  get startBidPrice() {
    return this._startPrice;
  }

  get highestBidder() {
    return this._highestBidder;
  }
  get timeRemaining() {
    const now = Date.now();
    return Math.max(0, this._endTime - now);
  }

  set highestBid(value) {
    if (value <= this._highestBid) {
      throw new Error("New bid must be higher than current highest bid");
    }
    this._highestBid = value;
  }
  set highestBidder(bidder) {
    if (!bidder) {
      throw new Error("Bidder cannot be null or undefined");
    }
    this._highestBidder = bidder;
  }

  isActive() {
    const now = Date.now();
    return now >= this._startTime && now < this._endTime;
  }
  _hasEnded() {
    return new Date().getTime() >= this._endTime;
  }

  _handleBidButton() {
    const bidButton = document.getElementById("bidButton"); // Assume you have a bid button with this ID
    if (this.isActive()) {
      bidButton.disabled = false;
    } else {
      bidButton.disabled = true;
    }
  }

  displayAuctionTimer() {
    const timerElement = document.getElementById("auctionTimer"); // Assume you have an element with this ID
    const updateTimer = () => {
      const remaining = this.timeRemaining;
      const hours = Math.floor(remaining / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      timerElement.textContent = `${hours}:${minutes}:${seconds}`;
      if (remaining > 0) {
        requestAnimationFrame(updateTimer);
      } else {
        timerElement.textContent = "Auction Ended";
      }
    };
    updateTimer();
  }

  placeBid(userId, amount) {
    if (this.isActive()) {
      this._bidManager.addBid(userId, amount);
    } else {
      throw new Error("Auction is not active");
    }
  }

  _onNewHighestBid(newBid) {
    this._highestBid = newBid.amount;
    this._highestBidder = newBid.userId;
    // Update DOM or notify UI
  }

  displayBidCount() {
    return this._bidManager.getBidCount();
  }
  startAuction() {
    if (new Date().getTime() >= this._startTime) {
      this._eventEmitter.emit("auctionStarted", this._auctionId);
      // Additional logic for starting the auction
    } else {
      throw new Error("It's not time to start the auction yet");
    }
  }

  endAuction() {
    if (this._hasEnded()) {
      const winner = this._bidManager.determineWinner();
      this._eventEmitter.emit("auctionEnded", {
        auctionId: this._auctionId,
        winner
      });
      // Additional logic for ending the auction
    } else {
      throw new Error("The auction hasn't ended yet");
    }
  }
}
