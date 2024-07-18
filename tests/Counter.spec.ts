import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { Counter } from '../wrappers/Counter';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('Counter', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Counter');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let counter: SandboxContract<Counter>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        counter = blockchain.openContract(Counter.createFromConfig({}, code));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await counter.sendNumber(deployer.getSender(), toNano('0.05'), 123n);

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: counter.address,
            deploy: true,
            // success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and counter are ready to use
        const caller = await blockchain.treasury('caller');
        await counter.sendNumber(caller.getSender(), toNano('0.01'), 10n);
        expect(await counter.getTotal()).toEqual(133n);

        await counter.sendNumber(caller.getSender(), toNano('0.01'), 5n);
        expect(await counter.getTotal()).toEqual(138n);

        await counter.sendNumber(caller.getSender(), toNano('0.01'), 1000n);
        expect(await counter.getTotal()).toEqual(1138n)
    });
});
