import SHA256 from "crypto-js/sha256";
import { ec as EC } from "elliptic";
const ec = new EC("secp256k1");

// 定义交易接口
interface ITransaction {
  from: string | null;
  to: string;
  amount: number;
  signature?: string;
}

class Transaction implements ITransaction {
  public signature?: string;

  constructor(
    public from: string | null,
    public to: string,
    public amount: number
  ) {}

  computeHash(): string {
    return SHA256(this.from + this.to + this.amount).toString();
  }

  sign(privateKey: EC.KeyPair): void {
    this.signature = privateKey.sign(this.computeHash(), "base64").toDER("hex");
  }

  isValid(): boolean {
    if (this.from === null) return true;
    if (!this.signature) throw new Error("签名缺失");
    const publicKey = ec.keyFromPublic(this.from, "hex");
    return publicKey.verify(this.computeHash(), this.signature);
  }
}

// ... 前面的代码省略 ...

class Block {
  public hash: string;
  public nonce: number;
  public previousHash: string;
  public timestamp: number;
  constructor(public transactions: Transaction[]) {
    this.nonce = 1;
    this.previousHash = "";
    this.hash = this.computeHash();
    this.timestamp = Date.now();
  }

  computeHash(): string {
    return SHA256(
      JSON.stringify(this.transactions) +
        this.previousHash +
        this.nonce +
        this.timestamp
    ).toString();
  }

  getAnswer(difficulty: number): string {
    return "0".repeat(difficulty);
  }

  mine(difficulty: number): void {
    if (!this.validateTransactions()) {
      throw new Error("发现异常交易，停止挖矿");
    }
    while (true) {
      this.hash = this.computeHash();
      if (this.hash.substring(0, difficulty) !== this.getAnswer(difficulty)) {
        this.nonce++;
      } else {
        break;
      }
    }
    //console.log("挖矿结束", this.hash);
  }

  validateTransactions(): boolean {
    return this.transactions.every((transaction) => transaction.isValid());
  }
}

// ... 前面的代码省略 ...

class Chain {
  public chain: Block[];
  private transactionPool: Transaction[];
  private minerReward: number;
  public difficulty: number;

  constructor() {
    this.chain = [this.bigBang()];
    this.transactionPool = [];
    this.minerReward = 50;
    this.difficulty = 1;
  }

  setDifficulty(difficulty: number): void {
    this.difficulty = difficulty;
  }

  private bigBang(): Block {
    const genesisBlock= new Block([]);
    genesisBlock.previousHash = "0".repeat(64); // 创世区块的 previousHash 通常设置为一串 0
    genesisBlock.hash = genesisBlock.computeHash();
    return genesisBlock;
  }

  getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  addTransaction(transaction: Transaction): void {
    if (!transaction.from || !transaction.to) {
      throw new Error("无效的发送方或接收方地址");
    }

    if (!transaction.isValid()) {
      throw new Error("无效交易，可能被篡改或签名无效");
    }

    this.transactionPool.push(transaction);
  }

  mineTransactionPool(minerRewardAddress: string): void {
    const minerRewardTransaction = new Transaction(
      null,
      minerRewardAddress,
      this.minerReward
    );
    this.transactionPool.push(minerRewardTransaction);

    const newBlock = new Block(this.transactionPool);
    newBlock.previousHash=this.getLatestBlock().hash;
    newBlock.mine(this.difficulty);

    this.chain.push(newBlock);
    this.transactionPool = [];
  }

  validateChain(): boolean {
    if (this.chain.length === 1) {
      return this.chain[0].hash === this.chain[0].computeHash();
    }

    for (let i = 1; i < this.chain.length; i++) {
      const blockToValidate = this.chain[i];
      if (!blockToValidate.validateTransactions()) {
        console.log("非法交易");
        return false;
      }
      if (blockToValidate.hash !== blockToValidate.computeHash()) {
        console.log("数据篡改");
        return false;
      }
      const previousBlock = this.chain[i - 1];
      if (blockToValidate.previousHash !== previousBlock.hash) {
        console.log("前后区块链接断裂");
        return false;
      }
    }
    return true;
  }

  printChainDetails(): void {
    this.chain.forEach((block, index) => {
      console.log(`\n区块 ${index}:`);
      console.log(`哈希: ${block.hash}`);
      console.log(`前一个区块哈希: ${block.previousHash}`);
      console.log(`时间戳: ${new Date(block.timestamp).toLocaleString()}`);
      console.log(`交易数量: ${block.transactions.length}`);
      block.transactions.forEach((tx, txIndex) => {
        console.log(`  交易 ${txIndex}:`);
        console.log(`    从: ${tx.from || '系统（矿工奖励）'}`);
        console.log(`    到: ${tx.to}`);
        console.log(`    金额: ${tx.amount}`);
      });
    });
  }
}

export { Chain, Block, Transaction, ec };
