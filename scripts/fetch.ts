import { writeFile, rm, mkdir } from 'fs/promises';
import axios from 'axios';

interface List {
	id: string;
	url: string;
}

const chains: Record<number, string> = {
	1: 'ethereum',
}

const lists: Record<number, List[]> = {
	1: [{
		id: 'coingecko',
		url: 'https://tokens.coingecko.com/uniswap/all.json',
	},
	{
		id: 'kleros',
		url: 'https://t2crtokens.eth.link/',
	},
	{
		id: 'mycrypto',
		url: 'https://uniswap.mycryptoapi.com/',
	},
	{
		id: 'zapper',
		url: 'https://zapper.fi/api/token-list',
	},
	{
		id: 'zerion',
		url: 'https://tokenlist.zerion.eth.link/',
	}],
};

const LIST_DIR = 'lists';

async function run() {
	await rm(LIST_DIR, {
		recursive: true,
	});
	await mkdir(LIST_DIR);
	const chainIds = Object.keys(lists).map(parseInt);
	for (const chainId of chainIds) {
		const chainLists = lists[chainId];
		for (const list of chainLists) {
			const { id, url } = list;
			const listData = await getList(url);
			const chain = chains[chainId];
			const fileName = `${chain}:${id}.json`;
			const filePath = `${LIST_DIR}/${fileName}`;
			const listString = JSON.stringify(listData, null, '\t');
			await writeFile(filePath, listString);
		}
	}
}

async function getList(url: string) {
	let delay = 100;
	while(true) {
		await sleep(delay);
		delay *= 2;
		try {
			const listResponse = await axios.get(url);
			if (listResponse.status !== 200) {
				continue;
			}
			return listResponse.data;
		} catch(e) {
			continue;
		}
	}
}

async function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms, null));
}

run();
