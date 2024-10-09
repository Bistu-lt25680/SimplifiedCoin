import SHA256 from "crypto-js/sha256";
import { ec as EC } from "elliptic";
const ec = new EC("secp256k1");

// 定义交易接口
interface TransactionInterface {
  from: string | null;
  to: string;
  amount: number;
  signature?: string;
}

// 定义交易类，继承自交易接口
class Transaction implements TransactionInterface {
  public signature?: string;

  constructor(
    public from: string | null,
    public to: string,
    public amount: number
  ) {}

  // 计算哈希
  computeHash(): string {
    return SHA256(this.from + this.to + this.amount).toString();
  }

  // 签名，传入私钥
  sign(privateKey: EC.KeyPair): void {
    this.signature = privateKey.sign(this.computeHash(), "base64").toDER("hex");
  }

  // 验证交易是否有效
  isValid(): boolean {
    if (this.from === null) return true;
    if (!this.signature) throw new Error("签名缺失");
    // 获取from的公钥
    const publicKey = ec.keyFromPublic(this.from, "hex");
    return publicKey.verify(this.computeHash(), this.signature);
  }
}

// 定义区块类
class Block {
  public hash: string;
  public nonce: number;
  public previousHash: string;
  public timestamp: number;
  // 一个区块包含多个交易
  constructor(public transactions: Transaction[]) {
    this.nonce = 1;
    this.previousHash = "";
    this.hash = this.computeHash();
    this.timestamp = Date.now();
  }

  computeHash(): string {
    return SHA256(
        // array转string
        JSON.stringify(this.transactions) +
        this.previousHash +
        this.nonce +
        this.timestamp
    ).toString();
  }

  // 生成挖矿答案
  getAnswer(difficulty: number): string {
    return "0".repeat(difficulty);
  }

  // 挖矿
  mine(difficulty: number): void {
    // 先验证交易是否有效
    if (!this.validateTransactions()) {
      throw new Error("发现异常交易，停止挖矿");
    }
    // 开挖
    while (true) {
      this.hash = this.computeHash();
      if (this.hash.substring(0, difficulty) !== this.getAnswer(difficulty)) {
        this.nonce++;
      } else {
        break;
      }
    }
    console.log("挖矿结束", this.hash);
  }

  // 验证区块中的交易是否有效
  validateTransactions(): boolean {
    return this.transactions.every((transaction) => transaction.isValid());
  }
}

// 定义区块链类
class Chain {
  public chain: Block[];
  private transactionPool: Transaction[];
  private minerReward: number;
  public difficulty: number;

  constructor() {
    // 初始化区块链,建立创世区块
    this.chain = [this.bigBang()];
    // 初始化交易池
    this.transactionPool = [];
    // 初始化矿工奖励
    this.minerReward = 50;
    // 初始化难度
    this.difficulty = 1;
  }

  // 设置难度
  setDifficulty(difficulty: number): void {
    this.difficulty = difficulty;
  }

  // 建立创世区块
  private bigBang(): Block {
    const genesisBlock= new Block([]);
    // 创世区块的 previousHash 通常设置为一串 0
    genesisBlock.previousHash = "0".repeat(64);
    genesisBlock.hash = genesisBlock.computeHash();
    return genesisBlock;
  }

  // 获取最新区块
  getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  // 添加交易到交易池
  addTransaction(transaction: Transaction): void {
    if (!transaction.from || !transaction.to) {
      throw new Error("无效的发送方或接收方地址");
    }

    if (!transaction.isValid()) {
      throw new Error("无效交易，可能被篡改或签名无效");
    }
    // 将交易添加到交易池
    this.transactionPool.push(transaction);
  }

  // 挖矿，将交易池中的交易打包到新的区块
  // 传入矿工地址，将矿工奖励添加到交易池
  mineTransactionPool(minerRewardAddress: string): void {
    // 创建一个矿工奖励交易
    const minerRewardTransaction = new Transaction(
      null,
      minerRewardAddress,
      this.minerReward
    );
    this.transactionPool.push(minerRewardTransaction);
    // 创建一个新区块，把交易池中的所有交易打包到新区块
    const newBlock = new Block(this.transactionPool);
    // 新区块的前一个区块哈希为最新区块的哈希
    newBlock.previousHash=this.getLatestBlock().hash;
    // 开挖
    newBlock.mine(this.difficulty);
    // 将新区块添加到区块链
    this.chain.push(newBlock);
    // 清空交易池
    this.transactionPool = [];
  }

  // 验证区块链是否有效
  validateChain(): boolean {
    if (this.chain.length === 1) {
      return this.chain[0].hash === this.chain[0].computeHash();
    }
    // 遍历区块链，验证每个区块是否有效
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

  // 打印区块链详情
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
