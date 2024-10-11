import { Chain, Block, Transaction, ec } from "./index";

const mychain = new Chain();

mychain.setDifficulty(3);

const keyPairSender = ec.genKeyPair();
const privateKeySender = keyPairSender.getPrivate("hex");
const publicKeySender = keyPairSender.getPublic("hex");

const keyPairReceiver = ec.genKeyPair();
const privateKeyReceiver = keyPairReceiver.getPrivate("hex");
const publicKeyReceiver = keyPairReceiver.getPublic("hex");

const t1 = new Transaction(publicKeySender, publicKeyReceiver, 100);
t1.sign(keyPairSender);


mychain.addTransaction(t1);
mychain.mineTransactionPool(publicKeyReceiver);
mychain.printChainDetails();
