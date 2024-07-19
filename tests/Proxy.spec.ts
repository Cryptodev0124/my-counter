import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano, beginCell } from '@ton/core';
import { Proxy } from '../wrappers/Proxy';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('Counter', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Counter');
    });

    let blockchain: Blockchain;
    let proxy: SandboxContract<Proxy>;
    let deployer: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');

        proxy = blockchain.openContract(
            Proxy.createFromConfig(
                {
                    owner: deployer.address,
                },
                code
            )
        );

        const deployResult = await proxy.sendDeploy(
            deployer.getSender(),
            toNano('0.01')
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: proxy.address,
            deploy: true,
        });
    });

    it('should forward from another wallet', async () => {
        let user = await blockchain.treasury('user');
        const result = await user.send({
            to: proxy.address,
            value: toNano('1'),
            body: beginCell().storeStringTail('Hello, world!').endCell(),
        });
        expect(result.transactions).toHaveTransaction({
            from: proxy.address,
            to: deployer.address,
            body: beginCell().storeAddress(user.address).storeRef(beginCell().storeStringTail('Hello, world!').endCell()).endCell(),
            value: (x) => (x ? toNano('0.99') <= x && x <= toNano('1') : false),
        });
    });
});
