import SHA256 from "crypto-js/sha256";
import EC from "elliptic";
const ec = new EC.ec("secp256k1");

class Block{
    public hash:string;
    constructor(
        public readonly data:string,
        public prevHash:string
    ){
        this.hash = this.computeHash();
    }

    computeHash(){
        return SHA256(this.prevHash + this.data).toString();
    }
}

// 链表
class Chain{
    public chain:Block[];
    constructor(){
        // 初始化链表，创建创世区块
        this.chain=[this.createGenesisBlock()];
    }

    // 创建创世区块
    createGenesisBlock(){
        const genesisBlock=new Block("创世区块", "");
        return genesisBlock;
    }

    // 获取链表中最后一个区块
    getLatestBlock(){
        return this.chain[this.chain.length-1];
    }

    addBlockToChain(newBlock:Block){
        newBlock.prevHash = this.getLatestBlock().hash;
        newBlock.hash = newBlock.computeHash();
        this.chain.push(newBlock);
    }
    
}
console.log("test");
export {Chain, Block};