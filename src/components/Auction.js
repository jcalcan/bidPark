import EventEmitter from "./EventEmitter.js";

export default class Auction {
  constructor(
    auctionId,
    startPrice,
    startTime,
    endTime,
    title,
    description,
    { lat, lng },
    eventEmitter,
    creator
  ) {
    this._auctionId = auctionId;
    this._startPrice = startPrice;
    this._startTime = startTime;
    this._endTime = endTime;
    this._title = title;
    this._description = description;
    this._eventEmitter = eventEmitter;
    this._creator = creator; // Store the seller/creator ID
    this._bids = [];
    this._highestBid = null;
    this._highestBidder = null;
    this._hasEnded = false; // Flag to track if auction has ended

    // Listen for bid placement events
    this._eventEmitter.on("bidPlaced", this.handleBidPlaced.bind(this));
    this._eventEmitter.off("auctionEnded", this.endAuction.bind(this));
    this._eventEmitter.on("auctionEnded", this.endAuction.bind(this));
  }

  get title() {
    return this._title;
  }
  get description() {
    return this._description;
  }
  get startTime() {
    return this._startTime;
  }

  get endTime() {
    return this._endTime;
  }

  get startPrice() {
    return this._startPrice;
  }

  get auctionId() {
    return this._auctionId;
  }

  get highestBid() {
    return this._highestBid;
  }

  get highestBidder() {
    return this._highestBidder;
  }

  get timeRemaining() {
    const now = Date.now();
    return Math.max(0, this._endTime - now);
  }

  isActive() {
    const now = Date.now();
    return now >= this._startTime && now < this._endTime;
  }

  // Method to get the highest bid of a specific user for this auction
  getUserHighestBid(userId) {
    const userBids = this._bids.filter((bid) => bid.userId === userId);
    return userBids.length > 0
      ? userBids.reduce(
          (max, bid) => (bid.amount > max.amount ? bid : max),
          userBids[0]
        )
      : null;
  }

  handleBidPlaced({ userId, auctionId, amount, errorMessageElement }) {
    if (this.isActive() && auctionId === this._auctionId) {
      errorMessageElement.textContent = "";
      // Validate if the new bid is higher than the user's previous highest bid
      const userHighestBid = this.getUserHighestBid(userId);
      if (userHighestBid && amount <= userHighestBid.amount) {
        errorMessageElement.textContent = `New bid must be higher than your previous highest bid of $${userHighestBid.amount}.`;
        return; // Reject the bid
      }

      // Check if the new bid is greater than or equal to the starting price
      if (amount < this._startPrice) {
        errorMessageElement.textContent = `New bid must be at least $${this._startPrice}.`;
        return; // Reject the bid
      }

      const newBid = {
        userId,
        amount,
        timestamp: Date.now(),
        auctionId: this._auctionId
      };
      this._bids.push(newBid);

      // Check if the new bid is the highest bid
      if (!this._highestBid || amount > this._highestBid.amount) {
        this._highestBid = newBid;
        this._highestBidder = userId;

        // Emit an event for the new highest bid
        this._eventEmitter.emit("newHighestBid", {
          auctionId: this._auctionId,
          userId: userId,
          amount: amount
        });
      }

      console.log(`New bid placed by ${userId}: $${amount}`);
    } else {
      errorMessageElement.textContent =
        "Auction is not active or ID does not match.";
    }
  }

  startAuction() {
    if (Date.now() >= this._startTime) {
      this._eventEmitter.emit("auctionStarted", this._auctionId);
      console.log(`Auction ${this._auctionId} has started.`);
    } else {
      throw new Error("It's not time to start the auction yet");
    }
  }

  // endAuction() {
  //   if (this.hasEnded()) {
  //     const winner = this.getWinner();
  //     this._eventEmitter.emit("auctionEnded", {
  //       auctionId: this._auctionId,
  //       winner
  //     });
  //     console.log(
  //       `Auction ${this._auctionId} has ended. Winner: ${
  //         winner ? winner.id : "None"
  //       }`
  //     );
  //   } else {
  //     throw new Error("The auction hasn't ended yet");
  //   }
  // }
  endAuction() {
    console.log("End auction method called"); // Debugging line
    if (this.hasEnded()) {
      if (this._hasEnded) return; // Prevent multiple calls
      this._hasEnded = true; // Set flag to true

      const winner = this.getWinner();
      if (winner) {
        // Notify winner
        this._eventEmitter.emit("auctionEnded", {
          auctionId: this._auctionId,
          winnerId: winner.id,
          winningAmount: winner.amount
        });
      }
      console.log(
        `Auction ${this._auctionId} has ended. Winner: ${
          winner ? winner.id : "None"
        }`
      );
    } else {
      throw new Error("The auction hasn't ended yet");
    }
  }

  hasEnded() {
    return Date.now() >= this._endTime;
  }

  getWinner() {
    if (!this._highestBid) return null; // No bids placed

    return {
      id: this.highestBidder,
      amount: this.highestBid.amount,
      timestamp: this.highestBid.timestamp
    };
  }

  displayBidCount() {
    return this._bids.length; // Return the total number of bids placed
  }
}
