// This project is based on web3

lockerAlphaAbi = [{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_owner","type":"address"},{"indexed":false,"internalType":"uint256","name":"_tokenId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"_timeStamp","type":"uint256"}],"name":"Locked","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_owner","type":"address"},{"indexed":false,"internalType":"uint256","name":"_tokenId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"_timeStamp","type":"uint256"}],"name":"Unlocked","type":"event"},{"inputs":[{"internalType":"uint256","name":"_tokenId","type":"uint256"}],"name":"lock","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"lockupWindow","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"nftLocker","outputs":[{"internalType":"bool","name":"locked","type":"bool"},{"internalType":"uint256","name":"tokenNumber","type":"uint256"},{"internalType":"address","name":"lockerOwner","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"nftTokenAddress","outputs":[{"internalType":"contract IERC721","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"toggleLockupWindow","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_tokenId","type":"uint256"}],"name":"unLockNFT","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"contract IERC721","name":"_token","type":"address"}],"name":"updateNftAddress","outputs":[],"stateMutability":"nonpayable","type":"function"}]

lockerAlphaAddress = '0xc385b3301c977F43eaE8e857C07526A0635bB754';

var cron = require('node-cron');
const { start } = require('repl');
var Web3 = require("web3");

var startBlock = 10577370;

const web3 = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io/v3/b86d378b3f044cd5a95acad88ad03c51"));
  
const lockerAlphaShark = new web3.eth.Contract(lockerAlphaAbi, lockerAlphaAddress);
cron.schedule('*/1 * * * *', async function(){
    console.log("Executor!");
    const endBlock = await web3.eth.getBlockNumber()
    getLockerEvents(startBlock, endBlock);
    startBlock = endBlock + 1;
});


async function getLockerEvents(startBlock, endBlock) {
    const output = [];
    const logs = [];

    let latest = await web3.eth.getBlockNumber()
    if (endBlock && endBlock < latest) {
        latest = endBlock
    }

    try {
        console.log({
            startBlock,
            latest,
        })
        await lockerAlphaShark.getPastEvents('Locked', {
            fromBlock: startBlock,
            toBlock: latest,
        }, () => {})
            .then(async (events) => {
                //console.log(JSON.stringify(events));
                for (let i = 0; i < events.length; i++) {
                    const transactionData = []
                    const logsData = []

                    const transactionHash = events[i].transactionHash;
                    const address = events[i].returnValues[0];
                    const tokenID = events[i].returnValues[1];
                    const timeStamp = events[i].returnValues[2];
                    console.log("LOCKED!");
                    // console.log("TX Hash: ",transactionHash);
                    console.log("Token ID ", tokenID);
                    // console.log("Address: ", address);
                    // console.log("Timestamp: ",timeStamp);
                }
            });
    } catch (error) {
        console.log(error)
        await this.resetWeb3Conn()
        return { error }
    }

    try {
        console.log({
            startBlock,
            latest,
        })
        await lockerAlphaShark.getPastEvents('Unlocked', {
            fromBlock: startBlock,
            toBlock: latest,
        }, () => {})
            .then(async (events) => {
                //console.log(JSON.stringify(events));
                for (let i = 0; i < events.length; i++) {
                    const transactionData = []
                    const logsData = []

                    const transactionHash = events[i].transactionHash;
                    const address = events[i].returnValues[0];
                    const tokenID = events[i].returnValues[1];
                    const timeStamp = events[i].returnValues[2];
                    console.log("UN-LOCKED!");
                    // console.log("TX Hash: ",transactionHash);
                    console.log("Token ID ", tokenID);
                    // console.log("Address: ", address);
                    // console.log("Timestamp: ",timeStamp);
                }
            });
        // return;
        return { result: output, latestBlock: latest, logs };
    } catch (error) {
        console.log(error)
        await this.resetWeb3Conn()
        return { error }
    }
}