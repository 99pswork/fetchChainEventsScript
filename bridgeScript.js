const Web3 = require("web3");
const { db } = require("../firebase");
const { PromisePool } = require("@supercharge/promise-pool");
const web3ProviderOptions = {
  timeout: 30000, // ms

  clientConfig: {
    // Useful if requests are large
    maxReceivedFrameSize: 100000000, // bytes - default: 1MiB
    maxReceivedMessageSize: 100000000, // bytes - default: 8MiB

    // Useful to keep a connection alive
    keepalive: true,
    keepaliveInterval: -1, // ms
  },

  // Enable auto reconnection
  reconnect: {
    auto: true,
    delay: 1000, // ms
    maxAttempts: 100,
    onTimeout: false,
  },
};
let provider_eth = new Web3.providers.WebsocketProvider("wss://rinkeby.infura.io/ws/v3/{Key}", web3ProviderOptions);
let provider_polygon = new Web3.providers.WebsocketProvider("wss://rinkeby.infura.io/ws/v3/{Key}", web3ProviderOptions);
let web3_eth = new Web3(provider_eth);
let web3_polygon = new Web3(provider_polygon);

const lockedTopic = "0xd4665e3049283582ba6f9eba07a5b3e12dab49e02da99e8927a47af5d134bea5";
const unlockedTopic = "0x3f2f29fa02cc34566ac167b446be0be9e0254cac18eda93b2dfe6a7a7c8affb9";
const topics = [[lockedTopic, unlockedTopic]];

const blockTimestamps = {};
let areHistoryEventsUpdating = false;

const lockerAlphaContractAddress = "0xc385b3301c977F43eaE8e857C07526A0635bB754";
/* prettier-ignore */
const lockerAlphaSharkAbi = [{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_owner","type":"address"},{"indexed":false,"internalType":"uint256","name":"_tokenId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"_timeStamp","type":"uint256"}],"name":"Locked","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_owner","type":"address"},{"indexed":false,"internalType":"uint256","name":"_tokenId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"_timeStamp","type":"uint256"}],"name":"Unlocked","type":"event"},{"inputs":[{"internalType":"uint256","name":"_tokenId","type":"uint256"}],"name":"lock","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"lockupWindow","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"nftLocker","outputs":[{"internalType":"bool","name":"locked","type":"bool"},{"internalType":"uint256","name":"tokenNumber","type":"uint256"},{"internalType":"address","name":"lockerOwner","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"nftTokenAddress","outputs":[{"internalType":"contract IERC721","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"toggleLockupWindow","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_tokenId","type":"uint256"}],"name":"unLockNFT","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"contract IERC721","name":"_token","type":"address"}],"name":"updateNftAddress","outputs":[],"stateMutability":"nonpayable","type":"function"}]
const lockerAlphaSharkContract = new web3_eth.eth.Contract(lockerAlphaSharkAbi, lockerAlphaContractAddress);

const privateKey = "{Privatekey}";
const account = web3_polygon.eth.accounts.privateKeyToAccount("0x" + privateKey);
web3_polygon.eth.accounts.wallet.add(account);
web3_polygon.eth.defaultAccount = account.address;

// Polygon contract configuration
const stakingPolygonContractAddress = "0x45808e40618f45518c90a449704670f0731083a1";
/* prettier-ignore */
const stakingAbi = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"inputs":[],"name":"ALPHA_SHARK_FACTORY","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_boostType","type":"uint256"},{"internalType":"uint256","name":"_tokenId","type":"uint256"}],"name":"activateBooster","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_boostType","type":"uint256"},{"internalType":"uint256","name":"_boostPercentage","type":"uint256"},{"internalType":"uint256","name":"_expireTimeStamp","type":"uint256"}],"name":"addBooster","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_address","type":"address"},{"internalType":"uint256","name":"_boostType","type":"uint256"}],"name":"assignBooster","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"availableBoosts","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_tokenId","type":"uint256"}],"name":"calculateTotalRewards","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_tokenId","type":"uint256"}],"name":"checkFixedBooster","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_tokenId","type":"uint256"}],"name":"checkShiverBreak","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_totalTokens","type":"uint256"}],"name":"claimAll","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"claimAllowed","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_tokenId","type":"uint256"}],"name":"claimRewards","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"emergencyRewardWithdraw","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_tokenId","type":"uint256"},{"internalType":"uint256","name":"activeBoostNumber","type":"uint256"}],"name":"getActiveBoost","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"getBooster","outputs":[{"internalType":"uint256","name":"boost_type","type":"uint256"},{"internalType":"uint256","name":"boostAmountPercentage","type":"uint256"},{"internalType":"uint256","name":"expireTimeStamp","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"getSharks","outputs":[{"internalType":"uint256","name":"sharkId","type":"uint256"},{"internalType":"uint256","name":"stakingTimeStamp","type":"uint256"},{"internalType":"uint256","name":"lastClaimTimeStamp","type":"uint256"},{"internalType":"address","name":"ownerAddress","type":"address"},{"internalType":"bool","name":"tokenStaked","type":"bool"},{"internalType":"bool","name":"shiver","type":"bool"},{"internalType":"uint256","name":"shiverId","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"getShiver","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_boostType","type":"uint256"}],"name":"ifBoostTypeAvailable","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"contract IERC20","name":"_rewardTokenAddress","type":"address"},{"internalType":"address","name":"_admin","type":"address"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"isInitialized","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"listOfBoosters","outputs":[{"internalType":"uint256","name":"boost_type","type":"uint256"},{"internalType":"uint256","name":"boostAmountPercentage","type":"uint256"},{"internalType":"uint256","name":"expireTimeStamp","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256[]","name":"listOfTokens","type":"uint256[]"}],"name":"makeShiver","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"rewardTokenAddress","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"shiverCounter","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_tokenId","type":"uint256"},{"internalType":"address","name":"_address","type":"address"}],"name":"stakeNFT","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_boostType","type":"uint256"}],"name":"stopBooster","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"toggleClaimReward","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"tokenDecimals","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"tokenIdReward","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_tokenId","type":"uint256"}],"name":"unStakeNFT","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256[]","name":"_rewards","type":"uint256[]"}],"name":"updateAllRewards","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"contract IERC20","name":"_rewardTokenAddress","type":"address"}],"name":"updateRewardAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_reward","type":"uint256"},{"internalType":"uint256","name":"_tokenId","type":"uint256"}],"name":"updateSingleReward","outputs":[],"stateMutability":"nonpayable","type":"function"}];
const stakingContract = new web3_polygon.eth.Contract(stakingAbi, stakingPolygonContractAddress, { from: web3_polygon.eth.defaultAccount });

const stakeUnstakeNFTOnPolygon = async (type, token_id, user_address, ethTransactionHash) => {
  try {
    let tx;
    if (type == "stake") {
      const gas = await stakingContract.methods.stakeNFT(parseInt(token_id), user_address).estimateGas({ gas: 5000000 });
      tx = await stakingContract.methods.stakeNFT(parseInt(token_id), user_address).send({ gas: Math.floor(gas * 1.3) });
    }
    if (type == "unstake") {
      const gas = await stakingContract.methods.unStakeNFT(parseInt(token_id)).estimateGas({ gas: 5000000 });
      tx = await stakingContract.methods.unStakeNFT(parseInt(token_id)).send({ gas: Math.floor(gas * 1.3) });
    }
    console.log(type);
    console.log(tx);
  } catch (error) {
    console.log(type);
    console.log(error);
    await db.collection("/stakingBridgeErrors").add({
      error: error instanceof Error ? error.message : error,
      timestamp: new Date(),
      ethTransactionHash: ethTransactionHash,
    });
  }
};

const processBlock = async (blockNumber) => {
  await lockerAlphaSharkContract
    .getPastEvents(
      "Locked",
      {
        fromBlock: blockNumber,
        toBlock: blockNumber,
      },
      () => {}
    )
    .then(async (events) => {
      await PromisePool.withConcurrency(10)
        .for(events)
        .process(async (event) => {
          const transactionData = [];
          const logsData = [];

          const transactionHash = event.transactionHash;
          const address = event.returnValues[0];
          const tokenID = event.returnValues[1];
          const timeStamp = event.returnValues[2];
          console.log("LOCKED!");
          console.log("TX Hash: ", transactionHash);
          console.log("Token ID ", tokenID);
          console.log("Address: ", address);
          console.log("Timestamp: ", timeStamp);

          await stakeUnstakeNFTOnPolygon("stake", tokenID, address, transactionHash);
        });
    });

  await lockerAlphaSharkContract
    .getPastEvents(
      "Unlocked",
      {
        fromBlock: blockNumber,
        toBlock: blockNumber,
      },
      () => {}
    )
    .then(async (events) => {
      await PromisePool.withConcurrency(10)
        .for(events)
        .process(async (event) => {
          const transactionData = [];
          const logsData = [];

          const transactionHash = event.transactionHash;
          const address = event.returnValues[0];
          const tokenID = event.returnValues[1];
          const timeStamp = event.returnValues[2];
          console.log("UNLOCKED!");
          console.log("TX Hash: ", transactionHash);
          console.log("Token ID ", tokenID);
          console.log("Address: ", address);
          console.log("Timestamp: ", timeStamp);

          await stakeUnstakeNFTOnPolygon("unstake", tokenID, address, transactionHash);
        });
    });
};

const stakingBridge = async () => {
  // listen to new block headers web3
  web3_eth.eth.subscribe("newBlockHeaders", async function (error, result) {
    if (result) {
      await db.doc("/stakingBridge").set({ currentBlockNumber: result.number }, { merge: true });
    }
  });

  db.doc("/stakingBridge").onSnapshot(async (doc) => {
    if (doc.data().lastUpdatedBlockNumber >= doc.data().currentBlockNumber - 1) {
      return;
    }
    if (areHistoryEventsUpdating == false) {
      areHistoryEventsUpdating = true;
      const blockNumberToUpdate = doc.data().lastUpdatedBlockNumber + 1;

      if (!(blockNumberToUpdate in blockTimestamps)) {
        const blockDetails = await web3_eth.eth.getBlock(blockNumberToUpdate);
        blockTimestamps[blockNumberToUpdate] = new Date(blockDetails.timestamp * 1000);
      }

      const blockNumbers = Object.keys(blockTimestamps);
      blockNumbers.forEach((blockNumber) => {
        if (blockNumber < blockNumberToUpdate - 3) {
          delete blockTimestamps[blockNumber];
        }
      });

      for (let i = blockNumberToUpdate; i <= doc.data().currentBlockNumber - 1; i++) {
        await processBlock(i);
        await db.doc("/stakingBridge").set({ lastUpdatedBlockNumber: i }, { merge: true });
      }
    }
  });
};

module.exports = { stakingBridge };
