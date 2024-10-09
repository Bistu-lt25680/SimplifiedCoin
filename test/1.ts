import {Chain, Block} from ".";

const chain = new Chain();
const block1 = new Block("转账10元", "123");

chain.addBlockToChain(block1);

console.log(chain);
